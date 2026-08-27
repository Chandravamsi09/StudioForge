import { Vector3 } from './vector3';

export class Box3 {
  min: Vector3;
  max: Vector3;

  constructor(min: Vector3 = new Vector3(Infinity, Infinity, Infinity), max: Vector3 = new Vector3(-Infinity, -Infinity, -Infinity)) {
    this.min = min;
    this.max = max;
  }

  setFromPoints(points: Vector3[]): this {
    this.min.set(Infinity, Infinity, Infinity);
    this.max.set(-Infinity, -Infinity, -Infinity);
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (p.x < this.min.x) this.min.x = p.x;
      if (p.y < this.min.y) this.min.y = p.y;
      if (p.z < this.min.z) this.min.z = p.z;
      if (p.x > this.max.x) this.max.x = p.x;
      if (p.y > this.max.y) this.max.y = p.y;
      if (p.z > this.max.z) this.max.z = p.z;
    }
    return this;
  }

  containsPoint(p: Vector3): boolean {
    return p.x >= this.min.x && p.x <= this.max.x &&
           p.y >= this.min.y && p.y <= this.max.y &&
           p.z >= this.min.z && p.z <= this.max.z;
  }

  intersectsBox(box: Box3): boolean {
    return !(box.max.x < this.min.x || box.min.x > this.max.x ||
             box.max.y < this.min.y || box.min.y > this.max.y ||
             box.max.z < this.min.z || box.min.z > this.max.z);
  }

  getCenter(target: Vector3): Vector3 {
    return target.addVectors(this.min, this.max).multiplyScalar(0.5);
  }
}

export class OctreeNode<T> {
  box: Box3;
  items: Array<{ point: Vector3; data: T }> = [];
  subNodes: OctreeNode<T>[] | null = null;
  maxItemsPerNode: number;
  maxDepth: number;
  currentDepth: number;

  constructor(box: Box3, maxItems: number = 8, maxDepth: number = 6, depth: number = 0) {
    this.box = box;
    this.maxItemsPerNode = maxItems;
    this.maxDepth = maxDepth;
    this.currentDepth = depth;
  }

  insert(point: Vector3, data: T): boolean {
    if (!this.box.containsPoint(point)) return false;

    if (this.subNodes === null && this.items.length < this.maxItemsPerNode || this.currentDepth >= this.maxDepth) {
      this.items.push({ point, data });
      return true;
    }

    if (this.subNodes === null) {
      this.subdivide();
    }

    for (let i = 0; i < 8; i++) {
      if (this.subNodes![i].insert(point, data)) return true;
    }

    return false;
  }

  private subdivide(): void {
    const center = new Vector3();
    this.box.getCenter(center);
    this.subNodes = [];

    for (let i = 0; i < 8; i++) {
      const min = new Vector3(
        (i & 1) ? center.x : this.box.min.x,
        (i & 2) ? center.y : this.box.min.y,
        (i & 4) ? center.z : this.box.min.z
      );
      const max = new Vector3(
        (i & 1) ? this.box.max.x : center.x,
        (i & 2) ? this.box.max.y : center.y,
        (i & 4) ? this.box.max.z : center.z
      );
      this.subNodes.push(new OctreeNode(new Box3(min, max), this.maxItemsPerNode, this.maxDepth, this.currentDepth + 1));
    }

    // Re-insert existing items
    const oldItems = this.items;
    this.items = [];
    for (let j = 0; j < oldItems.length; j++) {
      for (let i = 0; i < 8; i++) {
        if (this.subNodes[i].insert(oldItems[j].point, oldItems[j].data)) break;
      }
    }
  }

  queryRange(box: Box3, results: T[]): void {
    if (!this.box.intersectsBox(box)) return;

    for (let i = 0; i < this.items.length; i++) {
      if (box.containsPoint(this.items[i].point)) {
        results.push(this.items[i].data);
      }
    }

    if (this.subNodes !== null) {
      for (let i = 0; i < 8; i++) {
        this.subNodes[i].queryRange(box, results);
      }
    }
  }
}
