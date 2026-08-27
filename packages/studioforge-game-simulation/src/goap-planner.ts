/**
 * StudioForge Goal-Oriented Action Planning (GOAP) AI System
 * Implements symbolic A* search in world-state space to synthesize multi-step NPC action sequences.
 */

export type WorldState = Record<string, boolean | number>;

export interface Action {
  name: string;
  cost: number;
  preconditions: WorldState;
  effects: WorldState;
  execute?: () => Promise<boolean>;
}

export class GOAPPlanner {
  plan(currentState: WorldState, goalState: WorldState, availableActions: Action[]): Action[] | null {
    interface Node {
      state: WorldState;
      cost: number;
      action: Action | null;
      parent: Node | null;
    }

    const openList: Node[] = [{ state: { ...currentState }, cost: 0, action: null, parent: null }];
    const closedList: WorldState[] = [];

    while (openList.length > 0) {
      openList.sort((a, b) => a.cost - b.cost);
      const current = openList.shift()!;

      if (this.satisfiesGoal(current.state, goalState)) {
        return this.reconstructPlan(current);
      }

      closedList.push(current.state);

      for (let i = 0; i < availableActions.length; i++) {
        const action = availableActions[i];
        if (this.canExecute(current.state, action.preconditions)) {
          const nextState = this.applyEffects(current.state, action.effects);

          if (!this.isInClosedList(nextState, closedList)) {
            openList.push({
              state: nextState,
              cost: current.cost + action.cost,
              action,
              parent: current,
            });
          }
        }
      }
    }

    return null;
  }

  private satisfiesGoal(state: WorldState, goal: WorldState): boolean {
    for (const key in goal) {
      if (state[key] !== goal[key]) return false;
    }
    return true;
  }

  private canExecute(state: WorldState, preconditions: WorldState): boolean {
    for (const key in preconditions) {
      if (state[key] !== preconditions[key]) return false;
    }
    return true;
  }

  private applyEffects(state: WorldState, effects: WorldState): WorldState {
    return { ...state, ...effects };
  }

  private isInClosedList(state: WorldState, closedList: WorldState[]): boolean {
    return closedList.some((s) => {
      for (const key in state) {
        if (s[key] !== state[key]) return false;
      }
      return true;
    });
  }

  private reconstructPlan(node: any): Action[] {
    const plan: Action[] = [];
    let curr = node;
    while (curr && curr.action) {
      plan.unshift(curr.action);
      curr = curr.parent;
    }
    return plan;
  }
}
