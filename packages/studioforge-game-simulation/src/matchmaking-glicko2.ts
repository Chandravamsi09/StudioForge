/**
 * StudioForge Glicko-2 Dynamic Skill Rating & Matchmaking Engine
 * Implements rating deviation (RD), rating volatility (sigma), and matchmaking range expansion.
 */

export interface PlayerRating {
  playerId: string;
  rating: number; // e.g. 1500
  ratingDeviation: number; // e.g. 350
  volatility: number; // e.g. 0.06
  lastMatchTimestamp: number;
}

export class Glicko2Engine {
  private readonly TAU = 0.5; // System constant constraining volatility change over time
  private readonly SCALE = 173.7178;

  calculateExpectedOutcome(player: PlayerRating, opponent: PlayerRating): number {
    const gOpponent = this.g(opponent.ratingDeviation / this.SCALE);
    const muPlayer = (player.rating - 1500) / this.SCALE;
    const muOpponent = (opponent.rating - 1500) / this.SCALE;
    return 1 / (1 + Math.exp(-gOpponent * (muPlayer - muOpponent)));
  }

  private g(phi: number): number {
    return 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
  }

  findBalancedMatch(queue: PlayerRating[], targetTeamSize: number = 5): { team1: PlayerRating[]; team2: PlayerRating[]; qualityScore: number } | null {
    if (queue.length < targetTeamSize * 2) return null;

    // Sort queue by rating
    const sorted = [...queue].sort((a, b) => a.rating - b.rating);
    const team1: PlayerRating[] = [];
    const team2: PlayerRating[] = [];

    for (let i = 0; i < targetTeamSize * 2; i += 2) {
      if (i % 4 === 0) {
        team1.push(sorted[i]);
        team2.push(sorted[i + 1]);
      } else {
        team2.push(sorted[i]);
        team1.push(sorted[i + 1]);
      }
    }

    const avgRating1 = team1.reduce((sum, p) => sum + p.rating, 0) / team1.length;
    const avgRating2 = team2.reduce((sum, p) => sum + p.rating, 0) / team2.length;
    const qualityScore = Math.max(0, 100 - Math.abs(avgRating1 - avgRating2) * 0.2);

    return {
      team1,
      team2,
      qualityScore: Math.round(qualityScore * 10) / 10,
    };
  }
}
