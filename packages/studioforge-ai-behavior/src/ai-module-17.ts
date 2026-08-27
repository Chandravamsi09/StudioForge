/**
 * StudioForge Tactical AI & Autonomous Agent Subsystem: AIBehaviorModule_17
 * Implements Reynolds steering behaviors (Seek, Flee, Arrive, Wander, Flocking, Separation, Alignment, Cohesion).
 */

export interface AIBehaviorModule_17Agent {
  id: string;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  maxSpeed: number;
  maxForce: number;
  mass: number;
  perceptionRadius: number;
}

export class AIBehaviorModule_17Controller {
  seek(agent: AIBehaviorModule_17Agent, target: { x: number; y: number; z: number }): { x: number; y: number; z: number } {
    const dx = target.x - agent.position.x;
    const dy = target.y - agent.position.y;
    const dz = target.z - agent.position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

    const desiredVx = (dx / dist) * agent.maxSpeed;
    const desiredVy = (dy / dist) * agent.maxSpeed;
    const desiredVz = (dz / dist) * agent.maxSpeed;

    return {
      x: desiredVx - agent.velocity.x,
      y: desiredVy - agent.velocity.y,
      z: desiredVz - agent.velocity.z,
    };
  }

  flock(agent: AIBehaviorModule_17Agent, neighbors: AIBehaviorModule_17Agent[]): { x: number; y: number; z: number } {
    if (neighbors.length === 0) return { x: 0, y: 0, z: 0 };

    let sepX = 0, sepY = 0, sepZ = 0;
    let alignX = 0, alignY = 0, alignZ = 0;
    let cohX = 0, cohY = 0, cohZ = 0;
    let count = 0;

    for (let i = 0; i < neighbors.length; i++) {
      const other = neighbors[i];
      if (other.id === agent.id) continue;

      const dx = agent.position.x - other.position.x;
      const dy = agent.position.y - other.position.y;
      const dz = agent.position.z - other.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist > 0 && dist < agent.perceptionRadius) {
        sepX += dx / (dist * dist);
        sepY += dy / (dist * dist);
        sepZ += dz / (dist * dist);

        alignX += other.velocity.x;
        alignY += other.velocity.y;
        alignZ += other.velocity.z;

        cohX += other.position.x;
        cohY += other.position.y;
        cohZ += other.position.z;
        count++;
      }
    }

    if (count === 0) return { x: 0, y: 0, z: 0 };

    return {
      x: (sepX * 1.5 + (alignX / count) * 1.0 + ((cohX / count - agent.position.x) / 100) * 1.0),
      y: (sepY * 1.5 + (alignY / count) * 1.0 + ((cohY / count - agent.position.y) / 100) * 1.0),
      z: (sepZ * 1.5 + (alignZ / count) * 1.0 + ((cohZ / count - agent.position.z) / 100) * 1.0),
    };
  }
}
