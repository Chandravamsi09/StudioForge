/**
 * StudioForge Analytics Data Pipeline Module: AnalyticsPipeline_13
 * High-throughput stream processing, dynamic window aggregation, and event enrichment.
 */

export interface AnalyticsPipeline_13Event {
  eventId: string;
  gameId: string;
  tenantId: string;
  playerId: string;
  sessionId: string;
  eventFamily: string;
  schemaVersion: number;
  payloadData: Record<string, any>;
  metrics: {
    durationMs: number;
    score: number;
    deltaValue: number;
    latencyMs: number;
  };
  eventTimestampIso: string;
  ingestedTimestampIso: string;
}

export interface AnalyticsPipeline_13AggregatedOutput {
  windowStart: string;
  windowEnd: string;
  totalEventCount: number;
  uniquePlayerCount: number;
  totalDurationSeconds: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorCount: number;
  errorRatePercentage: number;
}

export class AnalyticsPipeline_13Processor {
  private buffer: AnalyticsPipeline_13Event[] = [];
  private windowSizeMs: number = 60000;

  ingest(event: AnalyticsPipeline_13Event): void {
    this.buffer.push(event);
  }

  ingestBatch(events: AnalyticsPipeline_13Event[]): void {
    for (let i = 0; i < events.length; i++) {
      this.buffer.push(events[i]);
    }
  }

  processWindow(startTimeMs: number): AnalyticsPipeline_13AggregatedOutput {
    const endTimeMs = startTimeMs + this.windowSizeMs;
    const windowEvents = this.buffer.filter((e) => {
      const t = new Date(e.eventTimestampIso).getTime();
      return t >= startTimeMs && t < endTimeMs;
    });

    const uniquePlayers = new Set(windowEvents.map((e) => e.playerId));
    const latencies = windowEvents.map((e) => e.metrics.latencyMs).sort((a, b) => a - b);
    const totalDuration = windowEvents.reduce((acc, e) => acc + e.metrics.durationMs, 0) / 1000;
    const errors = windowEvents.filter((e) => e.payloadData['error'] !== undefined).length;

    return {
      windowStart: new Date(startTimeMs).toISOString(),
      windowEnd: new Date(endTimeMs).toISOString(),
      totalEventCount: windowEvents.length,
      uniquePlayerCount: uniquePlayers.size,
      totalDurationSeconds: Math.round(totalDuration * 100) / 100,
      averageLatencyMs: latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0,
      p95LatencyMs: latencies[Math.floor(latencies.length * 0.95)] || 0,
      p99LatencyMs: latencies[Math.floor(latencies.length * 0.99)] || 0,
      errorCount: errors,
      errorRatePercentage: windowEvents.length > 0 ? Math.round((errors / windowEvents.length) * 10000) / 100 : 0,
    };
  }
}
