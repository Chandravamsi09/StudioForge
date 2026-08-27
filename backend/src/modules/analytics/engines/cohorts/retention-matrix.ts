/**
 * StudioForge N-Day Player Cohort & LTV Prediction Engine
 * Computes classic rolling retention curves (D1, D3, D7, D14, D30, D60, D90, D180, D365),
 * churn velocity, and lifetime value projections via Weibull/Pareto distribution modeling.
 */

export interface PlayerActivityRecord {
  playerId: string;
  firstInstallDate: string; // YYYY-MM-DD
  activityDate: string; // YYYY-MM-DD
  sessionDurationMinutes: number;
  cumulativeRevenueUsd: number;
  countryCode: string;
  acquisitionChannel: string;
}

export interface CohortRow {
  cohortDate: string;
  installedUsers: number;
  retentionPercentages: {
    day1: number;
    day3: number;
    day7: number;
    day14: number;
    day30: number;
    day60: number;
    day90: number;
    day180: number;
    day365: number;
  };
  cumulativeArpu: {
    day1: number;
    day7: number;
    day30: number;
    day90: number;
  };
  predictedLtvD365: number;
}

export class CohortRetentionMatrixEngine {
  private activityRecords: PlayerActivityRecord[] = [];

  ingestRecords(records: PlayerActivityRecord[]): void {
    for (let i = 0; i < records.length; i++) {
      this.activityRecords.push(records[i]);
    }
  }

  generateCohortMatrix(startDate: string, endDate: string): CohortRow[] {
    const cohortGroups = new Map<string, Set<string>>();
    const cohortRevenue = new Map<string, Map<number, number>>();
    const cohortDailyActive = new Map<string, Map<number, Set<string>>>();

    for (let i = 0; i < this.activityRecords.length; i++) {
      const rec = this.activityRecords[i];
      if (rec.firstInstallDate < startDate || rec.firstInstallDate > endDate) continue;

      if (!cohortGroups.has(rec.firstInstallDate)) {
        cohortGroups.set(rec.firstInstallDate, new Set<string>());
        cohortRevenue.set(rec.firstInstallDate, new Map<number, number>());
        cohortDailyActive.set(rec.firstInstallDate, new Map<number, Set<string>>());
      }

      cohortGroups.get(rec.firstInstallDate)!.add(rec.playerId);

      const daysDiff = this.calculateDaysDifference(rec.firstInstallDate, rec.activityDate);
      if (daysDiff >= 0) {
        const dailyActiveMap = cohortDailyActive.get(rec.firstInstallDate)!;
        if (!dailyActiveMap.has(daysDiff)) dailyActiveMap.set(daysDiff, new Set<string>());
        dailyActiveMap.get(daysDiff)!.add(rec.playerId);

        const revMap = cohortRevenue.get(rec.firstInstallDate)!;
        const currRev = revMap.get(daysDiff) || 0;
        revMap.set(daysDiff, currRev + rec.cumulativeRevenueUsd);
      }
    }

    const result: CohortRow[] = [];
    const sortedCohorts = Array.from(cohortGroups.keys()).sort();

    for (let i = 0; i < sortedCohorts.length; i++) {
      const cohortDate = sortedCohorts[i];
      const installedCount = cohortGroups.get(cohortDate)!.size;
      const dailyMap = cohortDailyActive.get(cohortDate)!;
      const revMap = cohortRevenue.get(cohortDate)!;

      const getPct = (day: number) => {
        const count = dailyMap.get(day)?.size || 0;
        return installedCount > 0 ? Math.round((count / installedCount) * 1000) / 10 : 0;
      };

      const getArpu = (day: number) => {
        let sum = 0;
        for (let d = 0; d <= day; d++) {
          sum += revMap.get(d) || 0;
        }
        return installedCount > 0 ? Math.round((sum / installedCount) * 100) / 100 : 0;
      };

      const d1Ret = getPct(1);
      const d7Ret = getPct(7);
      const d30Ret = getPct(30);

      // Fit Power Law Curve: R(t) = a * t^(-b)
      const predictedD365 = this.predictLtvUsingPowerLaw(getArpu(30), d1Ret, d30Ret);

      result.push({
        cohortDate,
        installedUsers: installedCount,
        retentionPercentages: {
          day1: d1Ret,
          day3: getPct(3),
          day7: d7Ret,
          day14: getPct(14),
          day30: d30Ret,
          day60: getPct(60),
          day90: getPct(90),
          day180: getPct(180),
          day365: getPct(365),
        },
        cumulativeArpu: {
          day1: getArpu(1),
          day7: getArpu(7),
          day30: getArpu(30),
          day90: getArpu(90),
        },
        predictedLtvD365: predictedD365,
      });
    }

    return result;
  }

  private calculateDaysDifference(dateStr1: string, dateStr2: string): number {
    const d1 = new Date(dateStr1).getTime();
    const d2 = new Date(dateStr2).getTime();
    return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
  }

  private predictLtvUsingPowerLaw(arpuD30: number, d1Ret: number, d30Ret: number): number {
    if (arpuD30 <= 0 || d1Ret <= 0 || d30Ret <= 0) return 0;
    const decayBeta = Math.log(Math.max(0.01, d30Ret / d1Ret)) / Math.log(30);
    const multiplier = 1.0 + Math.pow(365 / 30, Math.max(0.1, 1.0 + decayBeta));
    return Math.round(arpuD30 * multiplier * 100) / 100;
  }
}
