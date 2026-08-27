/**
 * StudioForge High-Throughput Bytecode Expression Virtual Machine
 * Stack-based VM designed for evaluating 1,000,000+ live-ops expressions per second per core.
 */

export enum Opcode {
  OP_CONSTANT = 0x01,
  OP_LOAD_VAR = 0x02,
  OP_ADD = 0x03,
  OP_SUB = 0x04,
  OP_MUL = 0x05,
  OP_DIV = 0x06,
  OP_MOD = 0x07,
  OP_EQUAL = 0x08,
  OP_NOT_EQUAL = 0x09,
  OP_GREATER = 0x0a,
  OP_GREATER_EQUAL = 0x0b,
  OP_LESS = 0x0c,
  OP_LESS_EQUAL = 0x0d,
  OP_AND = 0x0e,
  OP_OR = 0x0f,
  OP_NOT = 0x10,
  OP_JUMP = 0x11,
  OP_JUMP_IF_FALSE = 0x12,
  OP_POP = 0x13,
  OP_RETURN = 0x14,
}

export class BytecodeChunk {
  code: number[] = [];
  constants: any[] = [];
  lines: number[] = [];

  write(byte: number, line: number): void {
    this.code.push(byte);
    this.lines.push(line);
  }

  addConstant(value: any): number {
    this.constants.push(value);
    return this.constants.length - 1;
  }
}

export class VirtualMachine {
  private stack: any[] = [];
  private ip: number = 0;

  interpret(chunk: BytecodeChunk, environment: Record<string, any>): any {
    this.stack = [];
    this.ip = 0;

    while (this.ip < chunk.code.length) {
      const instruction: Opcode = chunk.code[this.ip++];

      switch (instruction) {
        case Opcode.OP_CONSTANT: {
          const constIndex = chunk.code[this.ip++];
          this.stack.push(chunk.constants[constIndex]);
          break;
        }
        case Opcode.OP_LOAD_VAR: {
          const varNameIndex = chunk.code[this.ip++];
          const varName = chunk.constants[varNameIndex];
          this.stack.push(environment[varName]);
          break;
        }
        case Opcode.OP_ADD: {
          const b = this.stack.pop();
          const a = this.stack.pop();
          this.stack.push(a + b);
          break;
        }
        case Opcode.OP_SUB: {
          const b = this.stack.pop();
          const a = this.stack.pop();
          this.stack.push(a - b);
          break;
        }
        case Opcode.OP_MUL: {
          const b = this.stack.pop();
          const a = this.stack.pop();
          this.stack.push(a * b);
          break;
        }
        case Opcode.OP_DIV: {
          const b = this.stack.pop();
          const a = this.stack.pop();
          this.stack.push(a / b);
          break;
        }
        case Opcode.OP_EQUAL: {
          const b = this.stack.pop();
          const a = this.stack.pop();
          this.stack.push(a === b);
          break;
        }
        case Opcode.OP_GREATER: {
          const b = this.stack.pop();
          const a = this.stack.pop();
          this.stack.push(a > b);
          break;
        }
        case Opcode.OP_LESS: {
          const b = this.stack.pop();
          const a = this.stack.pop();
          this.stack.push(a < b);
          break;
        }
        case Opcode.OP_AND: {
          const b = this.stack.pop();
          const a = this.stack.pop();
          this.stack.push(Boolean(a && b));
          break;
        }
        case Opcode.OP_OR: {
          const b = this.stack.pop();
          const a = this.stack.pop();
          this.stack.push(Boolean(a || b));
          break;
        }
        case Opcode.OP_NOT: {
          const a = this.stack.pop();
          this.stack.push(!a);
          break;
        }
        case Opcode.OP_JUMP_IF_FALSE: {
          const offset = (chunk.code[this.ip++] << 8) | chunk.code[this.ip++];
          const condition = this.stack[this.stack.length - 1];
          if (!condition) {
            this.ip += offset;
          }
          break;
        }
        case Opcode.OP_POP: {
          this.stack.pop();
          break;
        }
        case Opcode.OP_RETURN: {
          return this.stack.pop();
        }
        default:
          throw new Error(`Unknown opcode: 0x${instruction.toString(16)}`);
      }
    }

    return this.stack.pop();
  }
}
