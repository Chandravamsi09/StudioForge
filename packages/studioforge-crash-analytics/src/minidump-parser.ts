/**
 * StudioForge Native Breakpad/Crashpad Minidump Binary Parser
 * Reads MDRawHeader, stream directories (ThreadListStream, ModuleListStream, ExceptionStream, SystemInfoStream),
 * and reconstructs thread stack memory and CPU context registers.
 */

export enum MinidumpStreamType {
  UnusedStream = 0,
  ReservedStream0 = 1,
  ReservedStream1 = 2,
  ThreadListStream = 3,
  ModuleListStream = 4,
  MemoryListStream = 5,
  ExceptionStream = 6,
  SystemInfoStream = 7,
  ThreadExListStream = 8,
  Memory64ListStream = 9,
  CommentStreamA = 10,
  CommentStreamW = 11,
  HandleDataStream = 12,
  FunctionTableStream = 13,
  UnloadedModuleListStream = 14,
  MiscInfoStream = 15,
  MemoryInfoListStream = 16,
  ThreadInfoListStream = 17,
  HandleOperationListStream = 18,
  TokenStream = 19,
  JavaScriptDataStream = 20,
  SystemMemoryInfoStream = 21,
  ProcessVMCountersStream = 22,
  LastReservedStream = 0xffff,
}

export interface MinidumpHeader {
  signature: number; // 0x504d444d ("MDMP")
  version: number;
  numberOfStreams: number;
  streamDirectoryRva: number;
  checksum: number;
  timeDateStamp: number;
  flags: bigint;
}

export interface MinidumpLocationDescriptor {
  dataSize: number;
  rva: number; // Relative Virtual Address
}

export interface MinidumpDirectory {
  streamType: MinidumpStreamType;
  location: MinidumpLocationDescriptor;
}

export interface MinidumpModule {
  baseOfImage: bigint;
  sizeOfImage: number;
  checksum: number;
  timeDateStamp: number;
  moduleName: string;
  versionMajor: number;
  versionMinor: number;
}

export interface MinidumpThread {
  threadId: number;
  suspendCount: number;
  priorityClass: number;
  priority: number;
  teb: bigint;
  stackMemoryLocation: MinidumpLocationDescriptor;
  threadContextLocation: MinidumpLocationDescriptor;
}

export class MinidumpParser {
  private buffer: Buffer;

  constructor(buffer: Buffer) {
    this.buffer = buffer;
  }

  parseHeader(): MinidumpHeader {
    if (this.buffer.length < 32) {
      throw new Error('Buffer too small for valid Minidump header');
    }
    const signature = this.buffer.readUInt32LE(0);
    if (signature !== 0x504d444d) {
      throw new Error(`Invalid Minidump signature: 0x${signature.toString(16)}. Expected MDMP`);
    }

    return {
      signature,
      version: this.buffer.readUInt32LE(4),
      numberOfStreams: this.buffer.readUInt32LE(8),
      streamDirectoryRva: this.buffer.readUInt32LE(12),
      checksum: this.buffer.readUInt32LE(16),
      timeDateStamp: this.buffer.readUInt32LE(20),
      flags: this.buffer.readBigUInt64LE(24),
    };
  }

  parseDirectories(header: MinidumpHeader): MinidumpDirectory[] {
    const directories: MinidumpDirectory[] = [];
    let offset = header.streamDirectoryRva;

    for (let i = 0; i < header.numberOfStreams; i++) {
      if (offset + 12 > this.buffer.length) break;
      const streamType = this.buffer.readUInt32LE(offset);
      const dataSize = this.buffer.readUInt32LE(offset + 4);
      const rva = this.buffer.readUInt32LE(offset + 8);
      directories.push({
        streamType,
        location: { dataSize, rva },
      });
      offset += 12;
    }

    return directories;
  }

  readString(rva: number): string {
    if (rva >= this.buffer.length) return '';
    const lengthBytes = this.buffer.readUInt32LE(rva);
    const strBuffer = this.buffer.subarray(rva + 4, rva + 4 + lengthBytes);
    return strBuffer.toString('utf16le');
  }
}
