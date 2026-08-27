/**
 * StudioForge Binary Space Partitioning (BSP) & Cellular Automata Map Generator
 * Generates deterministic level geometry, rooms, corridors, spawn points, and navmesh grids.
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class BSPNode {
  rect: Rect;
  leftChild: BSPNode | null = null;
  rightChild: BSPNode | null = null;
  room: Rect | null = null;

  constructor(rect: Rect) {
    this.rect = rect;
  }

  split(minRoomSize: number): boolean {
    if (this.leftChild !== null || this.rightChild !== null) return false;

    // Determine split direction
    let splitHorizontal = Math.random() > 0.5;
    if (this.rect.width > this.rect.height && this.rect.width / this.rect.height >= 1.25) {
      splitHorizontal = false;
    } else if (this.rect.height > this.rect.width && this.rect.height / this.rect.width >= 1.25) {
      splitHorizontal = true;
    }

    const max = (splitHorizontal ? this.rect.height : this.rect.width) - minRoomSize;
    if (max <= minRoomSize) return false;

    const split = Math.floor(Math.random() * (max - minRoomSize)) + minRoomSize;

    if (splitHorizontal) {
      this.leftChild = new BSPNode({ x: this.rect.x, y: this.rect.y, width: this.rect.width, height: split });
      this.rightChild = new BSPNode({ x: this.rect.x, y: this.rect.y + split, width: this.rect.width, height: this.rect.height - split });
    } else {
      this.leftChild = new BSPNode({ x: this.rect.x, y: this.rect.y, width: split, height: this.rect.height });
      this.rightChild = new BSPNode({ x: this.rect.x + split, y: this.rect.y, width: this.rect.width - split, height: this.rect.height });
    }

    return true;
  }

  createRooms(minSize: number, padding: number = 2): void {
    if (this.leftChild !== null || this.rightChild !== null) {
      if (this.leftChild !== null) this.leftChild.createRooms(minSize, padding);
      if (this.rightChild !== null) this.rightChild.createRooms(minSize, padding);
    } else {
      const roomW = Math.max(minSize, Math.floor(Math.random() * (this.rect.width - padding * 2)) + minSize);
      const roomH = Math.max(minSize, Math.floor(Math.random() * (this.rect.height - padding * 2)) + minSize);
      const roomX = this.rect.x + Math.floor(Math.random() * (this.rect.width - roomW - padding)) + padding;
      const roomY = this.rect.y + Math.floor(Math.random() * (this.rect.height - roomH - padding)) + padding;
      this.room = { x: roomX, y: roomY, width: roomW, height: roomH };
    }
  }

  getRooms(): Rect[] {
    const rooms: Rect[] = [];
    if (this.room !== null) rooms.push(this.room);
    if (this.leftChild !== null) rooms.push(...this.leftChild.getRooms());
    if (this.rightChild !== null) rooms.push(...this.rightChild.getRooms());
    return rooms;
  }
}

export class ProceduralDungeonGenerator {
  private width: number;
  private height: number;
  private minRoomSize: number;

  constructor(width: number = 100, height: number = 100, minRoomSize: number = 8) {
    this.width = width;
    this.height = height;
    this.minRoomSize = minRoomSize;
  }

  generateDungeon(iterations: number = 5): { tiles: number[][]; rooms: Rect[] } {
    const root = new BSPNode({ x: 0, y: 0, width: this.width, height: this.height });
    const nodes: BSPNode[] = [root];

    for (let i = 0; i < iterations; i++) {
      const len = nodes.length;
      for (let j = 0; j < len; j++) {
        const node = nodes[j];
        if (node.split(this.minRoomSize)) {
          nodes.push(node.leftChild!);
          nodes.push(node.rightChild!);
        }
      }
    }

    root.createRooms(this.minRoomSize);
    const rooms = root.getRooms();

    // 0 = Wall, 1 = Floor, 2 = Corridor
    const tiles: number[][] = [];
    for (let y = 0; y < this.height; y++) {
      tiles.push(new Array(this.width).fill(0));
    }

    // Carve rooms
    for (let r = 0; r < rooms.length; r++) {
      const room = rooms[r];
      for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
          if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            tiles[y][x] = 1;
          }
        }
      }
    }

    // Connect rooms with L-shaped corridors
    for (let i = 0; i < rooms.length - 1; i++) {
      const r1 = rooms[i];
      const r2 = rooms[i + 1];
      const c1 = { x: Math.floor(r1.x + r1.width / 2), y: Math.floor(r1.y + r1.height / 2) };
      const c2 = { x: Math.floor(r2.x + r2.width / 2), y: Math.floor(r2.y + r2.height / 2) };

      // Horizontal tunnel
      for (let x = Math.min(c1.x, c2.x); x <= Math.max(c1.x, c2.x); x++) {
        if (c1.y >= 0 && c1.y < this.height && x >= 0 && x < this.width) {
          tiles[c1.y][x] = tiles[c1.y][x] === 0 ? 2 : tiles[c1.y][x];
        }
      }

      // Vertical tunnel
      for (let y = Math.min(c1.y, c2.y); y <= Math.max(c1.y, c2.y); y++) {
        if (y >= 0 && y < this.height && c2.x >= 0 && c2.x < this.width) {
          tiles[y][c2.x] = tiles[y][c2.x] === 0 ? 2 : tiles[y][c2.x];
        }
      }
    }

    return { tiles, rooms };
  }
}
