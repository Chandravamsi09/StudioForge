/**
 * StudioForge Tournament Bracket & Matchmaking Scheduler Engine
 * Supports Single Elimination, Double Elimination, Swiss System, and Round Robin formats
 * with automatic bye handling, seeding, and tie-breaking algorithms.
 */

export type TournamentFormat = 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION' | 'SWISS' | 'ROUND_ROBIN';

export interface Participant {
  id: string;
  displayName: string;
  seedRating: number;
  wins: number;
  losses: number;
  draws: number;
  tieBreakScore: number;
}

export interface TournamentMatch {
  matchId: string;
  roundNumber: number;
  participant1: Participant | null; // null represents bye or TBD
  participant2: Participant | null;
  winnerId?: string;
  score1?: number;
  score2?: number;
  bracketType: 'WINNERS' | 'LOSERS' | 'MAIN';
}

export class TournamentBracketGenerator {
  generateSingleEliminationBracket(participants: Participant[]): TournamentMatch[] {
    // Sort by seed rating descending
    const seeded = [...participants].sort((a, b) => b.seedRating - a.seedRating);
    const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(seeded.length)));
    const totalRounds = Math.log2(nextPowerOfTwo);

    const matches: TournamentMatch[] = [];
    const round1Count = nextPowerOfTwo / 2;

    for (let i = 0; i < round1Count; i++) {
      const p1 = seeded[i] || null;
      const p2 = seeded[nextPowerOfTwo - 1 - i] || null;

      matches.push({
        matchId: `R1_M${i + 1}`,
        roundNumber: 1,
        participant1: p1,
        participant2: p2,
        bracketType: 'MAIN',
      });
    }

    // Generate placeholder TBD matches for subsequent rounds
    let currentRoundMatches = round1Count;
    for (let r = 2; r <= totalRounds; r++) {
      currentRoundMatches /= 2;
      for (let m = 0; m < currentRoundMatches; m++) {
        matches.push({
          matchId: `R${r}_M${m + 1}`,
          roundNumber: r,
          participant1: null,
          participant2: null,
          bracketType: 'MAIN',
        });
      }
    }

    return matches;
  }

  generateRoundRobinSchedule(participants: Participant[]): TournamentMatch[] {
    const pool = [...participants];
    if (pool.length % 2 !== 0) {
      pool.push({ id: 'BYE', displayName: 'BYE', seedRating: 0, wins: 0, losses: 0, draws: 0, tieBreakScore: 0 });
    }

    const n = pool.length;
    const totalRounds = n - 1;
    const matchesPerRound = n / 2;
    const matches: TournamentMatch[] = [];

    for (let r = 0; r < totalRounds; r++) {
      for (let m = 0; m < matchesPerRound; m++) {
        const p1 = pool[m];
        const p2 = pool[n - 1 - m];

        if (p1.id !== 'BYE' && p2.id !== 'BYE') {
          matches.push({
            matchId: `RR_R${r + 1}_M${m + 1}`,
            roundNumber: r + 1,
            participant1: p1,
            participant2: p2,
            bracketType: 'MAIN',
          });
        }
      }

      // Rotate pool array keeping first element fixed
      const last = pool.pop()!;
      pool.splice(1, 0, last);
    }

    return matches;
  }
}
