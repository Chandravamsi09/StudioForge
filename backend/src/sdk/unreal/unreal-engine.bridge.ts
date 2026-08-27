/**
 * Unreal Engine 5.x C++ / Blueprints Remote Ingestion Bridge
 * Handles UObject property serialization, GameplayAbilitySystem (GAS) tag tracking,
 * Chaos physics simulation profiling, and Crashpad/Breakpad minidump transport.
 */

export interface UE5Vector {
  x: number;
  y: number;
  z: number;
}

export interface UE5Rotator {
  pitch: number;
  yaw: number;
  roll: number;
}

export interface UE5Transform {
  location: UE5Vector;
  rotation: UE5Rotator;
  scale: UE5Vector;
}

export interface UE5GameplayEffectEvent {
  effectClass: string;
  instigatorPlayerId: string;
  targetPlayerId: string;
  level: number;
  durationSeconds: number;
  periodSeconds: number;
  grantedTags: string[];
  appliedAttributes: Record<string, number>;
  timestamp: string;
}

export interface UE5ChaosPhysicsMetrics {
  rigidBodyCount: number;
  activeConstraintCount: number;
  collisionPairsEvaluated: number;
  broadphaseTimeMs: number;
  narrowphaseTimeMs: number;
  solverTimeMs: number;
  islandCount: number;
}

export interface UE5MinidumpPayload {
  crashGuid: string;
  gameVersion: string;
  unrealEngineVersion: string;
  buildConfiguration: 'Debug' | 'Development' | 'Test' | 'Shipping';
  gpuDriverVersion: string;
  directXVersion: 'D3D11' | 'D3D12' | 'Vulkan';
  callstackText: string;
  rawDumpBase64: string;
  logFileTail: string[];
}

export class UnrealEngineBridgeService {
  private activeSessions = new Map<string, { lastHeartbeat: number; transform: UE5Transform }>();

  processActorTransform(actorId: string, transform: UE5Transform): void {
    this.activeSessions.set(actorId, {
      lastHeartbeat: Date.now(),
      transform,
    });
  }

  evaluateGameplayEffect(event: UE5GameplayEffectEvent): { valid: boolean; modifiedAttributes: Record<string, number> } {
    const result: Record<string, number> = {};
    for (const [attr, delta] of Object.entries(event.appliedAttributes)) {
      result[attr] = delta * (1.0 + (event.level - 1) * 0.15);
    }
    return {
      valid: event.grantedTags.length > 0,
      modifiedAttributes: result,
    };
  }

  analyzeChaosPhysicsPerformance(metrics: UE5ChaosPhysicsMetrics): { isDegraded: boolean; totalPhysicsTimeMs: number; bottleneck: string } {
    const totalTime = metrics.broadphaseTimeMs + metrics.narrowphaseTimeMs + metrics.solverTimeMs;
    let bottleneck = 'NONE';
    if (metrics.solverTimeMs > 5.0) bottleneck = 'CONSTRAINT_SOLVER_OVERLOAD';
    else if (metrics.narrowphaseTimeMs > 4.0) bottleneck = 'COLLISION_PAIR_OVERFLOW';
    else if (metrics.broadphaseTimeMs > 3.0) bottleneck = 'SPATIAL_HASH_SATURATION';

    return {
      isDegraded: totalTime > 12.0,
      totalPhysicsTimeMs: totalTime,
      bottleneck,
    };
  }

  parseCrashpadMinidump(payload: UE5MinidumpPayload): { fatalFunction: string; moduleName: string; line: number } {
    const lines = payload.callstackText.split('\n');
    const firstCrashLine = lines.find((l) => l.includes('!') && !l.includes('ntdll') && !l.includes('KERNEL32')) || lines[0] || 'Unknown';
    const parts = firstCrashLine.split('!');
    const moduleName = parts[0]?.trim() || 'GameClient';
    const functionInfo = parts[1]?.trim() || 'UnknownFunction';

    return {
      fatalFunction: functionInfo,
      moduleName,
      line: 0,
    };
  }
}
