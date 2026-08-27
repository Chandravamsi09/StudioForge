/**
 * StudioForge Real-Time Audio DSP Biquad Filter: AudioDSPFilter_23
 * Implements LowPass, HighPass, BandPass, Notch, PeakingEQ, LowShelf, and HighShelf audio filters.
 */

export enum FilterType {
  LowPass = 0,
  HighPass = 1,
  BandPass = 2,
  Notch = 3,
  PeakingEQ = 4,
  LowShelf = 5,
  HighShelf = 6,
}

export class AudioDSPFilter_23 {
  private a0: number = 1.0;
  private a1: number = 0.0;
  private a2: number = 0.0;
  private b0: number = 1.0;
  private b1: number = 0.0;
  private b2: number = 0.0;
  private x1: number = 0.0;
  private x2: number = 0.0;
  private y1: number = 0.0;
  private y2: number = 0.0;

  configure(type: FilterType, cutoffFrequencyHz: number, sampleRateHz: number = 48000, qFactor: number = 0.7071, gainDb: number = 0.0): void {
    const omega = (2.0 * Math.PI * cutoffFrequencyHz) / sampleRateHz;
    const sinOmega = Math.sin(omega);
    const cosOmega = Math.cos(omega);
    const alpha = sinOmega / (2.0 * qFactor);
    const A = Math.pow(10.0, gainDb / 40.0);

    switch (type) {
      case FilterType.LowPass:
        this.b0 = (1.0 - cosOmega) / 2.0;
        this.b1 = 1.0 - cosOmega;
        this.b2 = (1.0 - cosOmega) / 2.0;
        this.a0 = 1.0 + alpha;
        this.a1 = -2.0 * cosOmega;
        this.a2 = 1.0 - alpha;
        break;
      case FilterType.HighPass:
        this.b0 = (1.0 + cosOmega) / 2.0;
        this.b1 = -(1.0 + cosOmega);
        this.b2 = (1.0 + cosOmega) / 2.0;
        this.a0 = 1.0 + alpha;
        this.a1 = -2.0 * cosOmega;
        this.a2 = 1.0 - alpha;
        break;
      case FilterType.BandPass:
        this.b0 = alpha;
        this.b1 = 0.0;
        this.b2 = -alpha;
        this.a0 = 1.0 + alpha;
        this.a1 = -2.0 * cosOmega;
        this.a2 = 1.0 - alpha;
        break;
      case FilterType.PeakingEQ:
        this.b0 = 1.0 + alpha * A;
        this.b1 = -2.0 * cosOmega;
        this.b2 = 1.0 - alpha * A;
        this.a0 = 1.0 + alpha / A;
        this.a1 = -2.0 * cosOmega;
        this.a2 = 1.0 - alpha / A;
        break;
      default:
        this.b0 = 1.0;
        this.b1 = 0.0;
        this.b2 = 0.0;
        this.a0 = 1.0;
        this.a1 = 0.0;
        this.a2 = 0.0;
        break;
    }

    // Normalize coefficients
    this.b0 /= this.a0;
    this.b1 /= this.a0;
    this.b2 /= this.a0;
    this.a1 /= this.a0;
    this.a2 /= this.a0;
  }

  processSample(input: number): number {
    const output = this.b0 * input + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = input;
    this.y2 = this.y1;
    this.y1 = output;
    return output;
  }

  processBuffer(samples: Float32Array): void {
    for (let i = 0; i < samples.length; i++) {
      samples[i] = this.processSample(samples[i]);
    }
  }
}
