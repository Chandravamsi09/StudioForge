/**
 * StudioForge LiveOps Configuration Template: LiveOpsTemplate_1
 * Defines rules, segmentation criteria, drop tables, reward progression, and runtime overrides.
 */

export interface LiveOpsTemplate_1Config {
  templateId: string;
  name: string;
  minPlayerLevel: number;
  maxPlayerLevel: number;
  requiredVipTier: number;
  rewardMultiplier: number;
  currencyCostOverrides: Record<string, number>;
  eligibleGeolocations: string[];
  activeFeatureFlags: string[];
  expirationTimestamp: string;
}

export class LiveOpsTemplate_1Evaluator {
  isPlayerEligible(config: LiveOpsTemplate_1Config, playerProfile: { level: number; vipTier: number; country: string }): boolean {
    if (playerProfile.level < config.minPlayerLevel || playerProfile.level > config.maxPlayerLevel) return false;
    if (playerProfile.vipTier < config.requiredVipTier) return false;
    if (config.eligibleGeolocations.length > 0 && !config.eligibleGeolocations.includes(playerProfile.country)) return false;
    return true;
  }

  applyEventModifiers(config: LiveOpsTemplate_1Config, baseRewards: Record<string, number>): Record<string, number> {
    const modified: Record<string, number> = {};
    for (const [key, val] of Object.entries(baseRewards)) {
      modified[key] = Math.round(val * config.rewardMultiplier);
    }
    return modified;
  }
}
