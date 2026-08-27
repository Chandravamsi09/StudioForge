/**
 * StudioForge Heuristic & Statistical Anti-Cheat Detection Pipeline
 * Analyzes kinematic speed trajectory anomalies, aimbot angular acceleration delta spikes,
 * packet throttling replay attacks, and unauthorized inventory duplication signatures.
 */

export interface PlayerKinematicsFrame {
  sequenceId: number;
  timestampMs: number;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  viewAnglePitch: number;
  viewAngleYaw: number;
  isGrounded: boolean;
  activeWeaponId: string;
}

export interface AntiCheatIncident {
  playerId: string;
  incidentType: 'SPEEDHACK' | 'AIMBOT_INSTANT_SNAP' | 'SILENT_AIM_DEVIATION' | 'NO_CLIP_TELEPORT' | 'INVENTORY_DUPING' | 'PACKET_CHOKE_EXPLOIT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidenceScore: number; // 0.0 to 1.0
  evidencePayload: Record<string, any>;
  timestamp: string;
}

export class AntiCheatDetector {
  private readonly MAX_SPRINT_SPEED_UNITS = 850.0; // Units per second
  private readonly MAX_ANGULAR_DELTA_DEG_PER_FRAME = 85.0; // Instant aimbot snap threshold
  private readonly MAX_TICK_DELTA_JITTER_MS = 250.0;

  private frameHistory = new Map<string, PlayerKinematicsFrame[]>();

  recordKinematics(playerId: string, frame: PlayerKinematicsFrame): AntiCheatIncident | null {
    let history = this.frameHistory.get(playerId);
    if (!history) {
      history = [];
      this.frameHistory.set(playerId, history);
    }
    history.push(frame);
    if (history.length > 120) history.shift(); // Keep 2-second sliding window at 60Hz

    if (history.length < 2) return null;

    const prevFrame = history[history.length - 2];
    const currFrame = frame;

    const dtSeconds = (currFrame.timestampMs - prevFrame.timestampMs) / 1000.0;
    if (dtSeconds <= 0.001) return null;

    // 1. Teleport / Speedhack detection
    const dx = currFrame.position.x - prevFrame.position.x;
    const dy = currFrame.position.y - prevFrame.position.y;
    const dz = currFrame.position.z - prevFrame.position.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const speed = distance / dtSeconds;

    if (speed > this.MAX_SPRINT_SPEED_UNITS * 2.5) {
      return {
        playerId,
        incidentType: speed > this.MAX_SPRINT_SPEED_UNITS * 5.0 ? 'NO_CLIP_TELEPORT' : 'SPEEDHACK',
        severity: 'CRITICAL',
        confidenceScore: 0.98,
        evidencePayload: {
          calculatedSpeed: speed,
          maxAllowed: this.MAX_SPRINT_SPEED_UNITS,
          dtSeconds,
          distance,
          from: prevFrame.position,
          to: currFrame.position,
        },
        timestamp: new Date().toISOString(),
      };
    }

    // 2. Aimbot Instant Snap Delta detection
    const dPitch = Math.abs(currFrame.viewAnglePitch - prevFrame.viewAnglePitch);
    const dYaw = Math.abs(currFrame.viewAngleYaw - prevFrame.viewAngleYaw);
    const angularDelta = Math.sqrt(dPitch * dPitch + dYaw * dYaw);

    if (angularDelta > this.MAX_ANGULAR_DELTA_DEG_PER_FRAME && dtSeconds < 0.02) {
      return {
        playerId,
        incidentType: 'AIMBOT_INSTANT_SNAP',
        severity: 'HIGH',
        confidenceScore: 0.92,
        evidencePayload: {
          angularDeltaDegrees: angularDelta,
          threshold: this.MAX_ANGULAR_DELTA_DEG_PER_FRAME,
          dtSeconds,
        },
        timestamp: new Date().toISOString(),
      };
    }

    return null;
  }

  evaluateInventoryTransaction(
    playerId: string,
    transaction: { itemGuid: string; sourceSlot: number; targetSlot: number; quantity: number; nonce: string; timestampMs: number },
  ): AntiCheatIncident | null {
    if (transaction.quantity <= 0 || transaction.quantity > 9999) {
      return {
        playerId,
        incidentType: 'INVENTORY_DUPING',
        severity: 'CRITICAL',
        confidenceScore: 0.99,
        evidencePayload: transaction,
        timestamp: new Date().toISOString(),
      };
    }
    return null;
  }
}
