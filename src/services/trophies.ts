export type Trophy = { id: string; season_id: string; category: string; title: string; value: number; awarded_at: string };
export type TrophySummary = { category: string; name: string; count: number };
export type TrophyCollection = { total: number; summary: TrophySummary[]; trophies: Trophy[] };

export const trophySymbols: Record<string, string> = {
  goals: '⚽', assists: '★', wins: '✓', losses: '↘', own_goals: '↩',
  yellow_cards: '🟨', red_cards: '🟥', goals_conceded: '🧤',
};
