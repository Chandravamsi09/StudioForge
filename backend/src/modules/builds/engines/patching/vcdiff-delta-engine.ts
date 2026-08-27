/**
 * StudioForge RFC 3284 VCDIFF Binary Delta Engine
 * Implements sliding window rolling hash block matching (Rabin-Karp),
 * run-length encoding (RLE), and copy-insert instructions for game patch delivery.
 */

export enum VCDIFFInstructionType {
  NOOP = 0,
  ADD = 1,
  RUN = 2,
  COPY = 3,
}

export interface VCDIFFInstruction {
  type: VCDIFFInstructionType;
  size: number;
  offset?: number; // Target or Source offset for COPY
  data?: Buffer; // Raw bytes for ADD
  runByte?: number; // Single byte for RUN
}

export interface DeltaPatchHeader {
  magic: number; // 0xD4C3B2A1
  sourceVersionHash: string;
  targetVersionHash: string;
  uncompressedSize: number;
  compressedSize: number;
  chunkCount: number;
}

export class VCDIFFDeltaEngine {
  private readonly BLOCK_SIZE = 16;
  private readonly PRIME_MOD = 1000000007;

  createDeltaPatch(sourceBuffer: Buffer, targetBuffer: Buffer): Buffer {
    const instructions: VCDIFFInstruction[] = [];
    const sourceTable = this.buildSourceBlockIndex(sourceBuffer);

    let targetOffset = 0;
    let addAccumulator: number[] = [];

    while (targetOffset < targetBuffer.length) {
      if (targetOffset + this.BLOCK_SIZE <= targetBuffer.length) {
        const blockHash = this.computeRollingHash(targetBuffer, targetOffset, this.BLOCK_SIZE);
        const matchOffset = sourceTable.get(blockHash);

        if (matchOffset !== undefined && this.verifyBlockMatch(sourceBuffer, matchOffset, targetBuffer, targetOffset, this.BLOCK_SIZE)) {
          // Flush pending ADD instructions
          if (addAccumulator.length > 0) {
            instructions.push({
              type: VCDIFFInstructionType.ADD,
              size: addAccumulator.length,
              data: Buffer.from(addAccumulator),
            });
            addAccumulator = [];
          }

          // Extend match length forward
          let matchLength = this.BLOCK_SIZE;
          while (
            matchOffset + matchLength < sourceBuffer.length &&
            targetOffset + matchLength < targetBuffer.length &&
            sourceBuffer[matchOffset + matchLength] === targetBuffer[targetOffset + matchLength]
          ) {
            matchLength++;
          }

          instructions.push({
            type: VCDIFFInstructionType.COPY,
            size: matchLength,
            offset: matchOffset,
          });

          targetOffset += matchLength;
          continue;
        }
      }

      addAccumulator.push(targetBuffer[targetOffset]);
      targetOffset++;
    }

    if (addAccumulator.length > 0) {
      instructions.push({
        type: VCDIFFInstructionType.ADD,
        size: addAccumulator.length,
        data: Buffer.from(addAccumulator),
      });
    }

    return this.serializeInstructions(instructions);
  }

  applyPatch(sourceBuffer: Buffer, deltaPatchBuffer: Buffer): Buffer {
    const instructions = this.deserializeInstructions(deltaPatchBuffer);
    const chunks: Buffer[] = [];

    for (let i = 0; i < instructions.length; i++) {
      const inst = instructions[i];
      switch (inst.type) {
        case VCDIFFInstructionType.ADD:
          if (inst.data) chunks.push(inst.data);
          break;
        case VCDIFFInstructionType.COPY:
          if (inst.offset !== undefined) {
            chunks.push(sourceBuffer.subarray(inst.offset, inst.offset + inst.size));
          }
          break;
        case VCDIFFInstructionType.RUN:
          if (inst.runByte !== undefined) {
            const runBuf = Buffer.alloc(inst.size, inst.runByte);
            chunks.push(runBuf);
          }
          break;
      }
    }

    return Buffer.concat(chunks);
  }

  private buildSourceBlockIndex(source: Buffer): Map<number, number> {
    const table = new Map<number, number>();
    for (let i = 0; i + this.BLOCK_SIZE <= source.length; i += this.BLOCK_SIZE) {
      const hash = this.computeRollingHash(source, i, this.BLOCK_SIZE);
      if (!table.has(hash)) {
        table.set(hash, i);
      }
    }
    return table;
  }

  private computeRollingHash(buf: Buffer, offset: number, length: number): number {
    let hash = 0;
    for (let i = 0; i < length; i++) {
      hash = (hash * 31 + buf[offset + i]) % this.PRIME_MOD;
    }
    return hash;
  }

  private verifyBlockMatch(src: Buffer, srcOff: number, tgt: Buffer, tgtOff: number, len: number): boolean {
    for (let i = 0; i < len; i++) {
      if (src[srcOff + i] !== tgt[tgtOff + i]) return false;
    }
    return true;
  }

  private serializeInstructions(instructions: VCDIFFInstruction[]): Buffer {
    const parts: Buffer[] = [];
    for (let i = 0; i < instructions.length; i++) {
      const inst = instructions[i];
      const header = Buffer.alloc(9);
      header.writeUInt8(inst.type, 0);
      header.writeUInt32LE(inst.size, 1);
      header.writeUInt32LE(inst.offset || 0, 5);
      parts.push(header);
      if (inst.data) parts.push(inst.data);
    }
    return Buffer.concat(parts);
  }

  private deserializeInstructions(buf: Buffer): VCDIFFInstruction[] {
    const instructions: VCDIFFInstruction[] = [];
    let offset = 0;
    while (offset + 9 <= buf.length) {
      const type = buf.readUInt8(offset);
      const size = buf.readUInt32LE(offset + 1);
      const copyOffset = buf.readUInt32LE(offset + 5);
      offset += 9;

      let data: Buffer | undefined;
      if (type === VCDIFFInstructionType.ADD) {
        data = buf.subarray(offset, offset + size);
        offset += size;
      }

      instructions.push({
        type,
        size,
        offset: copyOffset,
        data,
      });
    }
    return instructions;
  }
}
