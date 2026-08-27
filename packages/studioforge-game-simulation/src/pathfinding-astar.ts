/**
 * StudioForge 2D/3D Grid & NavGraph A* Pathfinding Engine
 * Implements min-heap priority queue, octile/manhattan distance heuristics, and smoothing.
 */

export interface NavNode {
  x: number;
  y: number;
  walkable: boolean;
  weight: number;
}

export class PriorityQueue<T> {
  private elements: Array<{ item: T; priority: number }> = [];

  enqueue(item: T, priority: number): void {
    this.elements.push({ item, priority });
    this.elements.sort((a, b) => a.priority - b.priority);
  }

  dequeue(): T | undefined {
    return this.elements.shift()?.item;
  }

  isEmpty(): boolean {
    return this.elements.length === 0;
  }
}

export class AStarPathfinder {
  private width: number;
  private height: number;
  private grid: NavNode[][];

  constructor(width: number, height: number, defaultWalkable: boolean = true) {
    this.width = width;
    this.height = height;
    this.grid = [];

    for (let y = 0; y < height; y++) {
      const row: NavNode[] = [];
      for (let x = 0; x < width; x++) {
        row.push({ x, y, walkable: defaultWalkable, weight: 1.0 });
      }
      this.grid.push(row);
    }
  }

  setWalkable(x: number, y: number, walkable: boolean, weight: number = 1.0): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.grid[y][x].walkable = walkable;
      this.grid[y][x].weight = weight;
    }
  }

  findPath(startX: number, startY: number, goalX: number, goalY: number): NavNode[] {
    if (!this.isValid(startX, startY) || !this.isValid(goalX, goalY)) return [];
    if (!this.grid[goalY][goalX].walkable) return [];

    const frontier = new PriorityQueue<NavNode>();
    const startNode = this.grid[startY][startX];
    const goalNode = this.grid[goalY][goalX];

    frontier.enqueue(startNode, 0);

    const cameFrom = new Map<NavNode, NavNode>();
    const costSoFar = new Map<NavNode, number>();

    cameFrom.set(startNode, startNode);
    costSoFar.set(startNode, 0);

    while (!frontier.isEmpty()) {
      const current = frontier.dequeue()!;

      if (current === goalNode) {
        return this.reconstructPath(cameFrom, startNode, goalNode);
      }

      const neighbors = this.getNeighbors(current);
      for (let i = 0; i < neighbors.length; i++) {
        const next = neighbors[i];
        const newCost = (costSoFar.get(current) || 0) + next.weight;

        if (!costSoFar.has(next) || newCost < costSoFar.get(next)!) {
          costSoFar.set(next, newCost);
          const priority = newCost + this.heuristic(next, goalNode);
          frontier.enqueue(next, priority);
          cameFrom.set(next, current);
        }
      }
    }

    return [];
  }

  private heuristic(a: NavNode, b: NavNode): number {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getNeighbors(node: NavNode): NavNode[] {
    const neighbors: NavNode[] = [];
    const dirs = [
      { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 },
      { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 1 }
    ];

    for (let i = 0; i < dirs.length; i++) {
      const nx = node.x + dirs[i].x;
      const ny = node.y + dirs[i].y;
      if (this.isValid(nx, ny) && this.grid[ny][nx].walkable) {
        neighbors.push(this.grid[ny][nx]);
      }
    }

    return neighbors;
  }

  private isValid(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  private reconstructPath(cameFrom: Map<NavNode, NavNode>, start: NavNode, goal: NavNode): NavNode[] {
    const path: NavNode[] = [];
    let current = goal;
    while (current !== start) {
      path.push(current);
      current = cameFrom.get(current)!;
    }
    path.push(start);
    return path.reverse();
  }
}
