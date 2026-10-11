export type Trophy = { id: string; season_id: string | null; championship_id: string | null; category: string; title: string; value: number; awarded_at: string };
export type TrophySummary = { category: string; name: string; count: number };
export type TrophyCollection = { total: number; summary: TrophySummary[]; trophies: Trophy[] };

export const trophySymbols: Record<string, string> = {
  season_champion: '🏆', goals: '⚽', assists: '★', wins: '✓', losses: '↘', own_goals: '↩',
  yellow_cards: '🟨', red_cards: '🟥', goals_conceded: '🧤',
  championship_champion: '🏆', championship_runner_up: '🥈', championship_goals: '⚽', championship_assists: '★',
};
