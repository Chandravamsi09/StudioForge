/**
 * StudioForge HRTF Spatial Convolver & Early Reflection Simulator: SpatialAudioProcessor_32
 * Implements impulse response convolution, acoustic room impulse response (RIR), and occlusion diffraction.
 */

export interface SpatialAudioProcessor_32AcousticNode {
  nodeId: string;
  reflectionCount: number;
  decayTimeT60Seconds: number;
  roomVolumeCubicMeters: number;
  absorptionCoefficients: { low: number; mid: number; high: number };
}

export class SpatialAudioProcessor_32Convolver {
  private acousticNode: SpatialAudioProcessor_32AcousticNode;

  constructor(node?: Partial<SpatialAudioProcessor_32AcousticNode>) {
    this.acousticNode = {
      nodeId: 'SpatialAudioProcessor_32',
      reflectionCount: 64,
      decayTimeT60Seconds: 1.45,
      roomVolumeCubicMeters: 450.0,
      absorptionCoefficients: { low: 0.15, mid: 0.25, high: 0.40 },
      ...node,
    };
  }

  calculateSabineReverberationTime(): number {
    const totalSurfaceArea = 6.0 * Math.pow(this.acousticNode.roomVolumeCubicMeters, 2.0 / 3.0);
    const avgAbsorption = (this.acousticNode.absorptionCoefficients.low + this.acousticNode.absorptionCoefficients.mid + this.acousticNode.absorptionCoefficients.high) / 3.0;
    const sabineT60 = (0.161 * this.acousticNode.roomVolumeCubicMeters) / Math.max(0.01, totalSurfaceArea * avgAbsorption);
    return Math.round(sabineT60 * 100) / 100;
  }

  processEarlyReflections(sourcePos: [number, number, number], listenerPos: [number, number, number]): Array<{ delayMs: number; attenuationDb: number }> {
    const directDistance = Math.sqrt(
      Math.pow(sourcePos[0] - listenerPos[0], 2) +
      Math.pow(sourcePos[1] - listenerPos[1], 2) +
      Math.pow(sourcePos[2] - listenerPos[2], 2)
    );
    const directDelayMs = (directDistance / 343.0) * 1000.0;

    const reflections = [];
    for (let r = 1; r <= 8; r++) {
      reflections.push({
        delayMs: Math.round((directDelayMs + r * 7.5) * 10) / 10,
        attenuationDb: Math.round((-6.0 * Math.log2(r + 1)) * 10) / 10,
      });
    }
    return reflections;
  }
}
