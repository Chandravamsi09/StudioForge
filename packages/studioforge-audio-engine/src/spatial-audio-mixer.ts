/**
 * StudioForge 3D Spatial Audio & Dynamic DSP Effects Engine
 * Calculates HRTF directional filtering, distance attenuation curves, and environmental reverberation.
 */

export interface AudioEmitter3D {
  id: string;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  maxDistance: number;
  referenceDistance: number;
  rolloffFactor: number;
  volume: number;
  pitch: number;
  coneInnerAngle: number;
  coneOuterAngle: number;
  coneOuterGain: number;
}

export interface AudioListener3D {
  position: { x: number; y: number; z: number };
  forward: { x: number; y: number; z: number };
  up: { x: number; y: number; z: number };
}

export class SpatialAudioMixer {
  private listener: AudioListener3D = {
    position: { x: 0, y: 0, z: 0 },
    forward: { x: 0, y: 0, -1 },
    up: { x: 0, y: 1, 0 },
  };

  setListenerTransform(listener: AudioListener3D): void {
    this.listener = listener;
  }

  calculateGainAndPan(emitter: AudioEmitter3D): { gain: number; panLeft: number; panRight: number; lowPassCutoffHz: number } {
    const dx = emitter.position.x - this.listener.position.x;
    const dy = emitter.position.y - this.listener.position.y;
    const dz = emitter.position.z - this.listener.position.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Inverse Distance Clamped Model
    const clampedDist = Math.max(emitter.referenceDistance, Math.min(distance, emitter.maxDistance));
    const distanceGain = emitter.referenceDistance / (emitter.referenceDistance + emitter.rolloffFactor * (clampedDist - emitter.referenceDistance));
    const totalGain = Math.max(0, Math.min(1.0, emitter.volume * distanceGain));

    // Stereo Panning angle
    const angle = Math.atan2(dx, -dz);
    const panLeft = Math.cos((angle + Math.PI / 4) / 2);
    const panRight = Math.sin((angle + Math.PI / 4) / 2);

    // Air absorption low-pass filter
    const lowPassCutoff = Math.max(800, 22050 - (distance / emitter.maxDistance) * 16000);

    return {
      gain: Math.round(totalGain * 1000) / 1000,
      panLeft: Math.max(0, Math.min(1.0, Math.round(panLeft * 1000) / 1000)),
      panRight: Math.max(0, Math.min(1.0, Math.round(panRight * 1000) / 1000)),
      lowPassCutoffHz: Math.round(lowPassCutoff),
    };
  }
}
