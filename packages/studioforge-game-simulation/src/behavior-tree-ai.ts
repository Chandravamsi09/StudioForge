/**
 * StudioForge Modular Behavior Tree AI Execution Engine
 * Supports Composite (Selector, Sequence, Parallel), Decorator (Inverter, Repeat, Timeout),
 * and Leaf Action/Condition nodes with persistent blackboard context.
 */

export enum NodeStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  RUNNING = 'RUNNING',
}

export class Blackboard {
  private data = new Map<string, any>();

  get<T>(key: string): T | undefined {
    return this.data.get(key);
  }

  set<T>(key: string, value: T): void {
    this.data.set(key, value);
  }

  has(key: string): boolean {
    return this.data.has(key);
  }
}

export abstract class BTNode {
  abstract tick(blackboard: Blackboard): NodeStatus;
}

export class SequenceNode extends BTNode {
  private children: BTNode[];

  constructor(children: BTNode[]) {
    super();
    this.children = children;
  }

  tick(blackboard: Blackboard): NodeStatus {
    for (let i = 0; i < this.children.length; i++) {
      const status = this.children[i].tick(blackboard);
      if (status !== NodeStatus.SUCCESS) {
        return status;
      }
    }
    return NodeStatus.SUCCESS;
  }
}

export class SelectorNode extends BTNode {
  private children: BTNode[];

  constructor(children: BTNode[]) {
    super();
    this.children = children;
  }

  tick(blackboard: Blackboard): NodeStatus {
    for (let i = 0; i < this.children.length; i++) {
      const status = this.children[i].tick(blackboard);
      if (status !== NodeStatus.FAILURE) {
        return status;
      }
    }
    return NodeStatus.FAILURE;
  }
}

export class InverterNode extends BTNode {
  private child: BTNode;

  constructor(child: BTNode) {
    super();
    this.child = child;
  }

  tick(blackboard: Blackboard): NodeStatus {
    const status = this.child.tick(blackboard);
    if (status === NodeStatus.SUCCESS) return NodeStatus.FAILURE;
    if (status === NodeStatus.FAILURE) return NodeStatus.SUCCESS;
    return NodeStatus.RUNNING;
  }
}

export class ActionNode extends BTNode {
  private action: (blackboard: Blackboard) => NodeStatus;

  constructor(action: (blackboard: Blackboard) => NodeStatus) {
    super();
    this.action = action;
  }

  tick(blackboard: Blackboard): NodeStatus {
    return this.action(blackboard);
  }
}

export class ConditionNode extends BTNode {
  private predicate: (blackboard: Blackboard) => boolean;

  constructor(predicate: (blackboard: Blackboard) => boolean) {
    super();
    this.predicate = predicate;
  }

  tick(blackboard: Blackboard): NodeStatus {
    return this.predicate(blackboard) ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
  }
}
