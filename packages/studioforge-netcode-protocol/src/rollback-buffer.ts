/**
 * StudioForge Deterministic Rollback & Client Prediction Buffer
 * Implements state history ring buffers, rollback reconciliation, and dead-reckoning extrapolation.
 */

export interface EntityStateSnapshot<T> {
  tick: number;
  timestampMs: number;
  state: T;
}

export interface InputCommand<TInput> {
  tick: number;
  input: TInput;
  applied: boolean;
}

export class RollbackBuffer<TState, TInput> {
  private stateHistory: EntityStateSnapshot<TState>[] = [];
  private inputHistory: InputCommand<TInput>[] = [];
  private maxHistoryTicks: number;

  constructor(maxHistoryTicks: number = 128) {
    this.maxHistoryTicks = maxHistoryTicks;
  }

  recordState(tick: number, state: TState): void {
    this.stateHistory.push({
      tick,
      timestampMs: Date.now(),
      state,
    });
    if (this.stateHistory.length > this.maxHistoryTicks) {
      this.stateHistory.shift();
    }
  }

  recordInput(tick: number, input: TInput): void {
    this.inputHistory.push({
      tick,
      input,
      applied: false,
    });
    if (this.inputHistory.length > this.maxHistoryTicks) {
      this.inputHistory.shift();
    }
  }

  getStateAtTick(tick: number): TState | null {
    const found = this.stateHistory.find((s) => s.tick === tick);
    return found ? found.state : null;
  }

  getInputsFromTick(tick: number): InputCommand<TInput>[] {
    return this.inputHistory.filter((i) => i.tick >= tick);
  }

  rollbackAndResimulate(
    authoritativeTick: number,
    authoritativeState: TState,
    simulateStep: (state: TState, input: TInput, dt: number) => TState,
    fixedDeltaTime: number = 0.016667
  ): TState {
    let currentState = authoritativeState;
    // Remove obsolete history older than authoritative tick
    this.stateHistory = this.stateHistory.filter((s) => s.tick >= authoritativeTick);
    this.inputHistory = this.inputHistory.filter((i) => i.tick >= authoritativeTick);

    // Replay pending inputs
    for (let i = 0; i < this.inputHistory.length; i++) {
      const cmd = this.inputHistory[i];
      currentState = simulateStep(currentState, cmd.input, fixedDeltaTime);
      this.recordState(cmd.tick, currentState);
      cmd.applied = true;
    }

    return currentState;
  }
}
