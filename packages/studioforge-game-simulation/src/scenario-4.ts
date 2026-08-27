/**
 * StudioForge Game World Scenario & Mission Logic: GameWorldScenario_4
 */

export interface MissionObjective {
  id: string;
  description: string;
  isCompleted: boolean;
  requiredCount: number;
  currentCount: number;
}

export class GameWorldScenario_4Controller {
  private objectives: MissionObjective[] = [];

  addObjective(obj: MissionObjective): void {
    this.objectives.push(obj);
  }

  updateProgress(objectiveId: string, delta: number): boolean {
    const obj = this.objectives.find((o) => o.id === objectiveId);
    if (!obj || obj.isCompleted) return false;

    obj.currentCount += delta;
    if (obj.currentCount >= obj.requiredCount) {
      obj.isCompleted = true;
    }
    return obj.isCompleted;
  }

  isMissionAccomplished(): boolean {
    return this.objectives.length > 0 && this.objectives.every((o) => o.isCompleted);
  }
}
