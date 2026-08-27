/**
 * StudioForge Virtual Game Economy Balancing & Sinks/Sources Simulator
 * Evaluates gold, gems, and crafting material inflation velocity, currency concentration (Gini coefficient),
 * and dynamic auction house pricing pressures.
 */

export interface EconomyTransaction {
  transactionId: string;
  playerId: string;
  currencyType: 'SOFT_GOLD' | 'HARD_GEMS' | 'CRAFTING_SHARDS' | 'SEASONAL_TOKENS';
  flowDirection: 'SOURCE' | 'SINK'; // SOURCE = Minted into economy, SINK = Burned/Destroyed
  category: 'QUEST_REWARD' | 'MONSTER_DROP' | 'IAP_PURCHASE' | 'UPGRADE_COST' | 'MARKETPLACE_TAX' | 'COSMETIC_PURCHASE';
  amount: number;
  playerLevel: number;
  timestamp: string;
}

export interface EconomyBalanceSummary {
  currencyType: string;
  totalMinted: number;
  totalBurned: number;
  netInflationRate: number; // Percentage
  giniCoefficient: number; // 0.0 (equal distribution) to 1.0 (hyper wealth concentration)
  velocityOfMoney: number;
  topSinkCategories: Array<{ category: string; amount: number; percentage: number }>;
  topSourceCategories: Array<{ category: string; amount: number; percentage: number }>;
  inflationRiskAssessment: 'HEALTHY' | 'SLIGHT_INFLATION' | 'HYPERINFLATION_WARNING' | 'DEFLATIONARY_CRUNCH';
}

export class SinksAndSourcesEngine {
  private transactions: EconomyTransaction[] = [];

  recordTransaction(tx: EconomyTransaction): void {
    this.transactions.push(tx);
  }

  recordBatch(txs: EconomyTransaction[]): void {
    for (let i = 0; i < txs.length; i++) {
      this.transactions.push(txs[i]);
    }
  }

  evaluateBalance(currency: 'SOFT_GOLD' | 'HARD_GEMS' | 'CRAFTING_SHARDS' | 'SEASONAL_TOKENS'): EconomyBalanceSummary {
    const txs = this.transactions.filter((t) => t.currencyType === currency);

    let totalMinted = 0;
    let totalBurned = 0;
    const sourceMap = new Map<string, number>();
    const sinkMap = new Map<string, number>();
    const playerBalances = new Map<string, number>();

    for (let i = 0; i < txs.length; i++) {
      const t = txs[i];
      const pBalance = playerBalances.get(t.playerId) || 0;

      if (t.flowDirection === 'SOURCE') {
        totalMinted += t.amount;
        sourceMap.set(t.category, (sourceMap.get(t.category) || 0) + t.amount);
        playerBalances.set(t.playerId, pBalance + t.amount);
      } else {
        totalBurned += t.amount;
        sinkMap.set(t.category, (sinkMap.get(t.category) || 0) + t.amount);
        playerBalances.set(t.playerId, Math.max(0, pBalance - t.amount));
      }
    }

    const netChange = totalMinted - totalBurned;
    const netInflationRate = totalMinted > 0 ? Math.round((netChange / totalMinted) * 1000) / 10 : 0;

    // Gini Coefficient calculation
    const balances = Array.from(playerBalances.values()).sort((a, b) => a - b);
    const gini = this.calculateGiniCoefficient(balances);

    // Top categories
    const topSinks = Array.from(sinkMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalBurned > 0 ? Math.round((amount / totalBurned) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const topSources = Array.from(sourceMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalMinted > 0 ? Math.round((amount / totalMinted) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    let risk: 'HEALTHY' | 'SLIGHT_INFLATION' | 'HYPERINFLATION_WARNING' | 'DEFLATIONARY_CRUNCH' = 'HEALTHY';
    if (netInflationRate > 40) risk = 'HYPERINFLATION_WARNING';
    else if (netInflationRate > 15) risk = 'SLIGHT_INFLATION';
    else if (netInflationRate < -10) risk = 'DEFLATIONARY_CRUNCH';

    return {
      currencyType: currency,
      totalMinted,
      totalBurned,
      netInflationRate,
      giniCoefficient: gini,
      velocityOfMoney: Math.round((totalBurned / Math.max(1, totalMinted)) * 100) / 100,
      topSinkCategories: topSinks,
      topSourceCategories: topSources,
      inflationRiskAssessment: risk,
    };
  }

  private calculateGiniCoefficient(sortedValues: number[]): number {
    const n = sortedValues.length;
    if (n === 0) return 0;

    let cumulativeSum = 0;
    let weightedSum = 0;

    for (let i = 0; i < n; i++) {
      cumulativeSum += sortedValues[i];
      weightedSum += (i + 1) * sortedValues[i];
    }

    if (cumulativeSum === 0) return 0;
    const gini = (2 * weightedSum) / (n * cumulativeSum) - (n + 1) / n;
    return Math.max(0, Math.min(1.0, Math.round(gini * 1000) / 1000));
  }
}
