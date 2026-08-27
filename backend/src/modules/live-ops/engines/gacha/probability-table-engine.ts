/**
 * StudioForge Gacha Drop-Rate & Pseudorandom Distribution (PRD) System
 * Implements hard pity guarantees, soft pity probability scaling, item pool weightings,
 * and duplicate shard compensation logic.
 */

export interface GachaItem {
  id: string;
  name: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
  weight: number;
  duplicateCompensationShards: number;
}

export interface GachaPoolConfig {
  poolId: string;
  items: GachaItem[];
  softPityStart: number; // e.g., 75 pulls
  hardPityLimit: number; // e.g., 90 pulls
  baseLegendaryRate: number; // e.g., 0.006 (0.6%)
  softPityRateIncrement: number; // e.g., 0.06 (6% per pull after soft pity)
}

export interface PullResult {
  item: GachaItem;
  pullNumber: number;
  wasSoftPityTriggered: boolean;
  wasHardPityTriggered: boolean;
  pityCounterReset: boolean;
}

export class GachaProbabilityEngine {
  private playerPityCounters = new Map<string, number>();

  executePull(playerId: string, pool: GachaPoolConfig): PullResult {
    const currentPity = (this.playerPityCounters.get(playerId) || 0) + 1;
    let legendaryRate = pool.baseLegendaryRate;
    let wasSoftPity = false;
    let wasHardPity = false;

    if (currentPity >= pool.hardPityLimit) {
      legendaryRate = 1.0;
      wasHardPity = true;
    } else if (currentPity >= pool.softPityStart) {
      const extraPulls = currentPity - pool.softPityStart;
      legendaryRate = Math.min(1.0, pool.baseLegendaryRate + extraPulls * pool.softPityRateIncrement);
      wasSoftPity = true;
    }

    const roll = Math.random();
    let selectedRarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';

    if (roll < legendaryRate) {
      selectedRarity = 'LEGENDARY';
      this.playerPityCounters.set(playerId, 0); // Reset pity counter
    } else if (roll < legendaryRate + 0.05) {
      selectedRarity = 'EPIC';
      this.playerPityCounters.set(playerId, currentPity);
    } else if (roll < legendaryRate + 0.30) {
      selectedRarity = 'RARE';
      this.playerPityCounters.set(playerId, currentPity);
    } else {
      selectedRarity = 'COMMON';
      this.playerPityCounters.set(playerId, currentPity);
    }

    const matchingItems = pool.items.filter((item) => item.rarity === selectedRarity);
    const chosenItem = this.weightedRandomSelect(matchingItems.length > 0 ? matchingItems : pool.items);

    return {
      item: chosenItem,
      pullNumber: currentPity,
      wasSoftPityTriggered: wasSoftPity,
      wasHardPityTriggered: wasHardPity,
      pityCounterReset: selectedRarity === 'LEGENDARY',
    };
  }

  private weightedRandomSelect(items: GachaItem[]): GachaItem {
    let totalWeight = 0;
    for (let i = 0; i < items.length; i++) totalWeight += items[i].weight;
    let r = Math.random() * totalWeight;
    for (let i = 0; i < items.length; i++) {
      r -= items[i].weight;
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }
}
