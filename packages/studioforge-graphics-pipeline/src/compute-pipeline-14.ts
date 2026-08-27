/**
 * StudioForge GPU Compute Dispatcher & ThreadGroup Dispatcher: ComputeShaderPipeline_14
 * Implements GPU indirect draw buffer packing, compute kernel dispatch, and UAV hazard tracking.
 */

export interface ComputeShaderPipeline_14DispatchDescriptor {
  kernelName: string;
  threadGroupCountX: number;
  threadGroupCountY: number;
  threadGroupCountZ: number;
  threadsPerGroup: [number, number, number];
  sharedMemorySizeBytes: number;
}

export class ComputeShaderPipeline_14Executor {
  private descriptor: ComputeShaderPipeline_14DispatchDescriptor;

  constructor(desc?: Partial<ComputeShaderPipeline_14DispatchDescriptor>) {
    this.descriptor = {
      kernelName: 'ComputeShaderPipeline_14_MainKernel',
      threadGroupCountX: 64,
      threadGroupCountY: 64,
      threadGroupCountZ: 1,
      threadsPerGroup: [16, 16, 1],
      sharedMemorySizeBytes: 32768,
      ...desc,
    };
  }

  getTotalInvocationCount(): number {
    const totalGroups = this.descriptor.threadGroupCountX * this.descriptor.threadGroupCountY * this.descriptor.threadGroupCountZ;
    const threadsPerGroupTotal = this.descriptor.threadsPerGroup[0] * this.descriptor.threadsPerGroup[1] * this.descriptor.threadsPerGroup[2];
    return totalGroups * threadsPerGroupTotal;
  }

  evaluateOccupancy(maxSharedMemoryPerSM: number = 65536, maxWarpsPerSM: number = 64): { theoreticalOccupancyPct: number; bottleneck: string } {
    const warpsPerGroup = Math.ceil((this.descriptor.threadsPerGroup[0] * this.descriptor.threadsPerGroup[1] * this.descriptor.threadsPerGroup[2]) / 32);
    const groupsLimitedBySharedMem = Math.floor(maxSharedMemoryPerSM / Math.max(1, this.descriptor.sharedMemorySizeBytes));
    const activeWarps = Math.min(maxWarpsPerSM, groupsLimitedBySharedMem * warpsPerGroup);
    const occupancy = (activeWarps / maxWarpsPerSM) * 100;

    return {
      theoreticalOccupancyPct: Math.round(occupancy * 10) / 10,
      bottleneck: groupsLimitedBySharedMem < 4 ? 'SHARED_MEMORY_BOUND' : 'WARP_SCHEDULER_BOUND',
    };
  }
}
