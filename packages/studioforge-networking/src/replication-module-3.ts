/**
 * StudioForge Network Replication & Spatial Interest Grid: NetworkReplicationModule_3
 * Manages spatial interest visibility zones, delta state compression, and client relevancy grids.
 */

export interface NetworkEntitySnapshot {
  netId: number;
  position: { x: number; y: number; z: number };
  rotation: { pitch: number; yaw: number; roll: number };
  stateFlags: number;
  relevancyRadius: number;
}

export class NetworkReplicationModule_3Manager {
  private cellSize: number = 64.0;
  private grid = new Map<string, Set<number>>();
  private entities = new Map<number, NetworkEntitySnapshot>();

  registerEntity(entity: NetworkEntitySnapshot): void {
    this.entities.set(entity.netId, entity);
    this.updateEntityCell(entity);
  }

  private getCellKey(x: number, z: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    return `${cx}_${cz}`;
  }

  private updateEntityCell(entity: NetworkEntitySnapshot): void {
    const key = this.getCellKey(entity.position.x, entity.position.z);
    let cell = this.grid.get(key);
    if (!cell) {
      cell = new Set<number>();
      this.grid.set(key, cell);
    }
    cell.add(entity.netId);
  }

  getRelevantEntitiesForClient(clientPosition: { x: number; y: number; z: number }, viewDistance: number = 128.0): NetworkEntitySnapshot[] {
    const relevant: NetworkEntitySnapshot[] = [];
    const minCx = Math.floor((clientPosition.x - viewDistance) / this.cellSize);
    const maxCx = Math.floor((clientPosition.x + viewDistance) / this.cellSize);
    const minCz = Math.floor((clientPosition.z - viewDistance) / this.cellSize);
    const maxCz = Math.floor((clientPosition.z + viewDistance) / this.cellSize);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cz = minCz; cz <= maxCz; cz++) {
        const cell = this.grid.get(`${cx}_${cz}`);
        if (cell) {
          for (const netId of cell) {
            const ent = this.entities.get(netId);
            if (ent) relevant.push(ent);
          }
        }
      }
    }

    return relevant;
  }
}
