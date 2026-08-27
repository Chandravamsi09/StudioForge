/**
 * Unity Engine 2022/2023/6000 C# Telemetry & Performance Profiler Bridge
 * Handles Burst compiler stats, Garbage Collection allocation spikes,
 * NavMesh pathfinding latency, and rendering draw-call instrumentation.
 */

export interface UnityFrameProfile {
  frameIndex: number;
  deltaTimeMs: number;
  cpuTimeMs: number;
  gpuTimeMs: number;
  gcAllocBytes: number;
  drawCalls: number;
  setPassCalls: number;
  trianglesCount: number;
  verticesCount: number;
  activeGameObjects: number;
}

export interface UnityNavMeshQueryMetrics {
  agentCount: number;
  pathQueriesPerFrame: number;
  averagePathSearchTimeMs: number;
  failedPathQueries: number;
}

export class UnityEngineBridgeService {
  analyzeFramePerformance(frame: UnityFrameProfile): {
    targetFps: number;
    achievedFps: number;
    hasGCHitch: boolean;
    renderingBottleneck: boolean;
  } {
    const achievedFps = 1000.0 / Math.max(0.001, frame.deltaTimeMs);
    const hasGCHitch = frame.gcAllocBytes > 1024 * 512; // Spike > 512KB
    const renderingBottleneck = frame.drawCalls > 2500 || frame.setPassCalls > 800;

    return {
      targetFps: 60,
      achievedFps: Math.round(achievedFps * 10) / 10,
      hasGCHitch,
      renderingBottleneck,
    };
  }

  evaluateNavMeshCapacity(metrics: UnityNavMeshQueryMetrics): {
    isCongested: boolean;
    dropRatePercentage: number;
  } {
    const dropRate = (metrics.failedPathQueries / Math.max(1, metrics.pathQueriesPerFrame)) * 100;
    return {
      isCongested: metrics.averagePathSearchTimeMs > 4.0 || dropRate > 5.0,
      dropRatePercentage: Math.round(dropRate * 100) / 100,
    };
  }
}
