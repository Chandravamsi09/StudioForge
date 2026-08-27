/**
 * StudioForge OLAP Time-Series Stream Aggregator
 * Implements hyper-fast sliding window bucketing, quantiles calculation (p50, p90, p99, p99.9),
 * exponential moving averages (EMA), and real-time histogram binning.
 */

export interface MetricDataPoint {
  timestamp: number; // Unix epoch ms
  value: number;
  tags: Record<string, string>;
}

export interface AggregatedBucket {
  bucketStart: number;
  bucketEnd: number;
  count: number;
  sum: number;
  min: number;
  max: number;
  mean: number;
  variance: number;
  stdDev: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  p999: number;
}

export interface HistogramBin {
  binMin: number;
  binMax: number;
  count: number;
  percentage: number;
}

export class TimeSeriesAggregator {
  private points: MetricDataPoint[] = [];
  private maxPointsRetained: number;

  constructor(maxPointsRetained: number = 50000) {
    this.maxPointsRetained = maxPointsRetained;
  }

  insert(point: MetricDataPoint): void {
    this.points.push(point);
    if (this.points.length > this.maxPointsRetained) {
      this.points.splice(0, this.points.length - this.maxPointsRetained);
    }
  }

  insertBatch(points: MetricDataPoint[]): void {
    for (let i = 0; i < points.length; i++) {
      this.points.push(points[i]);
    }
    if (this.points.length > this.maxPointsRetained) {
      this.points.splice(0, this.points.length - this.maxPointsRetained);
    }
  }

  aggregate(bucketSizeMs: number, startTime?: number, endTime?: number): AggregatedBucket[] {
    if (this.points.length === 0) return [];

    const now = Date.now();
    const start = startTime || (this.points[0]?.timestamp ?? now - 3600000);
    const end = endTime || now;

    const filtered = this.points.filter((p) => p.timestamp >= start && p.timestamp <= end);
    if (filtered.length === 0) return [];

    // Group into buckets
    const bucketMap = new Map<number, number[]>();
    for (let i = 0; i < filtered.length; i++) {
      const p = filtered[i];
      const bucketIndex = Math.floor((p.timestamp - start) / bucketSizeMs);
      const bucketKey = start + bucketIndex * bucketSizeMs;
      let values = bucketMap.get(bucketKey);
      if (!values) {
        values = [];
        bucketMap.set(bucketKey, values);
      }
      values.push(p.value);
    }

    const results: AggregatedBucket[] = [];
    const sortedKeys = Array.from(bucketMap.keys()).sort((a, b) => a - b);

    for (let i = 0; i < sortedKeys.length; i++) {
      const bStart = sortedKeys[i];
      const bEnd = bStart + bucketSizeMs;
      const vals = bucketMap.get(bStart) || [];
      if (vals.length === 0) continue;

      vals.sort((a, b) => a - b);
      const count = vals.length;
      let sum = 0;
      let min = vals[0];
      let max = vals[vals.length - 1];

      for (let j = 0; j < count; j++) {
        sum += vals[j];
      }

      const mean = sum / count;
      let sumSqDiff = 0;
      for (let j = 0; j < count; j++) {
        sumSqDiff += Math.pow(vals[j] - mean, 2);
      }
      const variance = sumSqDiff / count;
      const stdDev = Math.sqrt(variance);

      results.push({
        bucketStart: bStart,
        bucketEnd: bEnd,
        count,
        sum,
        min,
        max,
        mean,
        variance,
        stdDev,
        p50: this.getPercentile(vals, 0.5),
        p90: this.getPercentile(vals, 0.9),
        p95: this.getPercentile(vals, 0.95),
        p99: this.getPercentile(vals, 0.99),
        p999: this.getPercentile(vals, 0.999),
      });
    }

    return results;
  }

  computeHistogram(numBins: number = 10, startTime?: number, endTime?: number): HistogramBin[] {
    if (this.points.length === 0) return [];
    const now = Date.now();
    const start = startTime || 0;
    const end = endTime || now;

    const filtered = this.points.filter((p) => p.timestamp >= start && p.timestamp <= end);
    if (filtered.length === 0) return [];

    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < filtered.length; i++) {
      const v = filtered[i].value;
      if (v < min) min = v;
      if (v > max) max = v;
    }

    if (min === max) {
      return [{ binMin: min, binMax: max, count: filtered.length, percentage: 100 }];
    }

    const binWidth = (max - min) / numBins;
    const bins: number[] = new Array(numBins).fill(0);

    for (let i = 0; i < filtered.length; i++) {
      const v = filtered[i].value;
      let binIndex = Math.floor((v - min) / binWidth);
      if (binIndex >= numBins) binIndex = numBins - 1;
      bins[binIndex]++;
    }

    const total = filtered.length;
    return bins.map((count, index) => {
      const bMin = min + index * binWidth;
      const bMax = bMin + binWidth;
      return {
        binMin: Math.round(bMin * 100) / 100,
        binMax: Math.round(bMax * 100) / 100,
        count,
        percentage: Math.round((count / total) * 10000) / 100,
      };
    });
  }

  computeExponentialMovingAverage(alpha: number = 0.2): number[] {
    if (this.points.length === 0) return [];
    const emas: number[] = [this.points[0].value];
    for (let i = 1; i < this.points.length; i++) {
      const prevEma = emas[i - 1];
      const currVal = this.points[i].value;
      const currEma = alpha * currVal + (1 - alpha) * prevEma;
      emas.push(currEma);
    }
    return emas;
  }

  private getPercentile(sortedVals: number[], p: number): number {
    if (sortedVals.length === 0) return 0;
    const index = p * (sortedVals.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    if (lower === upper) return sortedVals[lower];
    return sortedVals[lower] * (1 - weight) + sortedVals[upper] * weight;
  }
}
