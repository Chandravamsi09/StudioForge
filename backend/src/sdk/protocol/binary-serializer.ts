/**
 * StudioForge Ultra-Low Latency Binary Protocol Serializer
 * Implements variable-length zig-zag varint encoding, bitmask field packing,
 * CRC32 checksum verification, and high-density telemetry stream serialization.
 */

export enum WireType {
  VARINT = 0,
  FIXED64 = 1,
  LENGTH_DELIMITED = 2,
  START_GROUP = 3,
  END_GROUP = 4,
  FIXED32 = 5,
}

export interface TelemetryPacketHeader {
  magic: number; // 0x53465247 ("SFRG")
  version: number;
  tenantId: string;
  gameId: string;
  sequenceNumber: number;
  payloadLength: number;
  crc32Checksum: number;
  flags: number;
}

export class ByteWriter {
  private buffer: Buffer;
  private offset: number = 0;

  constructor(initialCapacity: number = 1024) {
    this.buffer = Buffer.allocUnsafe(initialCapacity);
  }

  private ensureCapacity(needed: number): void {
    if (this.offset + needed > this.buffer.length) {
      let newCapacity = Math.max(this.buffer.length * 2, this.offset + needed + 1024);
      const newBuffer = Buffer.allocUnsafe(newCapacity);
      this.buffer.copy(newBuffer, 0, 0, this.offset);
      this.buffer = newBuffer;
    }
  }

  writeUint8(val: number): void {
    this.ensureCapacity(1);
    this.buffer.writeUInt8(val, this.offset++);
  }

  writeUint16LE(val: number): void {
    this.ensureCapacity(2);
    this.buffer.writeUInt16LE(val, this.offset);
    this.offset += 2;
  }

  writeUint32LE(val: number): void {
    this.ensureCapacity(4);
    this.buffer.writeUInt32LE(val, this.offset);
    this.offset += 4;
  }

  writeInt32LE(val: number): void {
    this.ensureCapacity(4);
    this.buffer.writeInt32LE(val, this.offset);
    this.offset += 4;
  }

  writeFloatLE(val: number): void {
    this.ensureCapacity(4);
    this.buffer.writeFloatLE(val, this.offset);
    this.offset += 4;
  }

  writeDoubleLE(val: number): void {
    this.ensureCapacity(8);
    this.buffer.writeDoubleLE(val, this.offset);
    this.offset += 8;
  }

  writeVarint(val: number): void {
    let unsigned = val >>> 0;
    while (unsigned >= 0x80) {
      this.writeUint8((unsigned & 0x7f) | 0x80);
      unsigned >>>= 7;
    }
    this.writeUint8(unsigned);
  }

  writeZigZag32(val: number): void {
    const encoded = (val << 1) ^ (val >> 31);
    this.writeVarint(encoded);
  }

  writeString(str: string): void {
    const strBuf = Buffer.from(str, 'utf8');
    this.writeVarint(strBuf.length);
    this.ensureCapacity(strBuf.length);
    strBuf.copy(this.buffer, this.offset);
    this.offset += strBuf.length;
  }

  writeRawBuffer(buf: Buffer): void {
    this.ensureCapacity(buf.length);
    buf.copy(this.buffer, this.offset);
    this.offset += buf.length;
  }

  getBuffer(): Buffer {
    return this.buffer.subarray(0, this.offset);
  }
}

export class ByteReader {
  private buffer: Buffer;
  private offset: number = 0;

  constructor(buffer: Buffer) {
    this.buffer = buffer;
  }

  readUint8(): number {
    return this.buffer.readUInt8(this.offset++);
  }

  readUint16LE(): number {
    const val = this.buffer.readUInt16LE(this.offset);
    this.offset += 2;
    return val;
  }

  readUint32LE(): number {
    const val = this.buffer.readUInt32LE(this.offset);
    this.offset += 4;
    return val;
  }

  readInt32LE(): number {
    const val = this.buffer.readInt32LE(this.offset);
    this.offset += 4;
    return val;
  }

  readFloatLE(): number {
    const val = this.buffer.readFloatLE(this.offset);
    this.offset += 4;
    return val;
  }

  readDoubleLE(): number {
    const val = this.buffer.readDoubleLE(this.offset);
    this.offset += 8;
    return val;
  }

  readVarint(): number {
    let result = 0;
    let shift = 0;
    while (true) {
      const byte = this.readUint8();
      result |= (byte & 0x7f) << shift;
      if (!(byte & 0x80)) break;
      shift += 7;
      if (shift >= 35) throw new Error('Varint parsing overflow error');
    }
    return result;
  }

  readZigZag32(): number {
    const n = this.readVarint();
    return (n >>> 1) ^ -(n & 1);
  }

  readString(): string {
    const len = this.readVarint();
    const str = this.buffer.toString('utf8', this.offset, this.offset + len);
    this.offset += len;
    return str;
  }

  remainingBytes(): number {
    return this.buffer.length - this.offset;
  }
}

export class BinaryTelemetryCodec {
  private static readonly MAGIC = 0x53465247; // "SFRG"

  static encodePacket(header: Omit<TelemetryPacketHeader, 'magic' | 'crc32Checksum' | 'payloadLength'>, payload: Buffer): Buffer {
    const writer = new ByteWriter();
    writer.writeUint32LE(this.MAGIC);
    writer.writeUint8(header.version);
    writer.writeString(header.tenantId);
    writer.writeString(header.gameId);
    writer.writeUint32LE(header.sequenceNumber);
    writer.writeUint16LE(header.flags);
    writer.writeUint32LE(payload.length);

    // Compute checksum
    const crc = this.computeCRC32(payload);
    writer.writeUint32LE(crc);
    writer.writeRawBuffer(payload);

    return writer.getBuffer();
  }

  static decodePacket(raw: Buffer): { header: TelemetryPacketHeader; payload: Buffer } {
    const reader = new ByteReader(raw);
    const magic = reader.readUint32LE();
    if (magic !== this.MAGIC) {
      throw new Error(`Invalid magic bytes: 0x${magic.toString(16)}. Expected SFRG`);
    }

    const version = reader.readUint8();
    const tenantId = reader.readString();
    const gameId = reader.readString();
    const sequenceNumber = reader.readUint32LE();
    const flags = reader.readUint16LE();
    const payloadLength = reader.readUint32LE();
    const crc32Checksum = reader.readUint32LE();

    const payload = raw.subarray(raw.length - payloadLength);
    const actualCrc = this.computeCRC32(payload);
    if (actualCrc !== crc32Checksum) {
      throw new Error(`CRC32 checksum mismatch: calculated ${actualCrc}, expected ${crc32Checksum}`);
    }

    return {
      header: {
        magic,
        version,
        tenantId,
        gameId,
        sequenceNumber,
        flags,
        payloadLength,
        crc32Checksum,
      },
      payload,
    };
  }

  static computeCRC32(buf: Buffer): number {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      let byte = buf[i];
      for (let j = 0; j < 8; j++) {
        const bit = (crc ^ byte) & 1;
        crc >>>= 1;
        if (bit) crc ^= 0xedb88320;
        byte >>>= 1;
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }
}
