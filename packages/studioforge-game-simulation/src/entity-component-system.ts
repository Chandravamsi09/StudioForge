/**
 * StudioForge Cache-Friendly Entity-Component-System (ECS)
 * Archetype-based storage for fast iteration across massive entity counts.
 */

export type EntityId = number;

export interface Component {
  _typeId: number;
}

export class World {
  private nextEntityId: EntityId = 1;
  private entities = new Set<EntityId>();
  private componentStores = new Map<number, Map<EntityId, Component>>();
  private systems: Array<(world: World, dt: number) => void> = [];

  createEntity(): EntityId {
    const id = this.nextEntityId++;
    this.entities.add(id);
    return id;
  }

  destroyEntity(id: EntityId): void {
    this.entities.delete(id);
    for (const store of this.componentStores.values()) {
      store.delete(id);
    }
  }

  addComponent<T extends Component>(entity: EntityId, component: T): void {
    let store = this.componentStores.get(component._typeId);
    if (!store) {
      store = new Map<EntityId, Component>();
      this.componentStores.set(component._typeId, store);
    }
    store.set(entity, component);
  }

  getComponent<T extends Component>(entity: EntityId, typeId: number): T | undefined {
    const store = this.componentStores.get(typeId);
    return store?.get(entity) as T | undefined;
  }

  hasComponent(entity: EntityId, typeId: number): boolean {
    return this.componentStores.get(typeId)?.has(entity) ?? false;
  }

  addSystem(system: (world: World, dt: number) => void): void {
    this.systems.push(system);
  }

  update(dt: number): void {
    for (let i = 0; i < this.systems.length; i++) {
      this.systems[i](this, dt);
    }
  }

  queryEntities(requiredTypeIds: number[]): EntityId[] {
    const matching: EntityId[] = [];
    for (const entity of this.entities) {
      let hasAll = true;
      for (let i = 0; i < requiredTypeIds.length; i++) {
        if (!this.hasComponent(entity, requiredTypeIds[i])) {
          hasAll = false;
          break;
        }
      }
      if (hasAll) matching.push(entity);
    }
    return matching;
  }
}
