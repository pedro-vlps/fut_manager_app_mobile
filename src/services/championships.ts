import type { MatchAction } from './lifecycle';

export const formats = { groups_knockout: 'Grupos + mata-mata', knockout: 'Mata-mata', cascade: 'Cascata', league: 'Liga (pontos corridos)' };
export const statuses = { registration: 'Inscrições abertas', in_progress: 'Em andamento', finished: 'Finalizado' };
export type Format = keyof typeof formats;
export type ClubPlayer = { id: string; name: string; status: 'pending' | 'accepted' | 'declined' };
export type Club = { id: string; name: string; owner_id: string; members: ClubPlayer[] };
export type Invitation = { id: string; club_id: string; club_name: string };
export type Championship = { id: string; code: string; name: string; season: string; description: string | null; owner_id: string; format: Format; capacity: number; home_and_away: boolean; status: keyof typeof statuses; champion_id: string | null };
export type Entry = { id: string; club_id: string; name: string; seed: number; players: ClubPlayer[] };
export type ChampionshipMatch = { id: string; sequence: number; stage: 'league' | 'groups' | 'knockout' | 'winners' | 'losers' | 'grand_final'; round: number; pool: string | null; home_id: string; away_id: string; home_score: number | null; away_score: number | null; winner_id: string | null; home_goalkeeper_id: string | null; away_goalkeeper_id: string | null; statistics_complete: boolean; actions: (MatchAction & { presence_id: string })[] };
export type Standing = { club_id: string; pool: string; played: number; points: number; wins: number; draws: number; losses: number; goals_for: number; goals_against: number; seed: number };
export type PlayerRanking = { profile_id: string; name: string; club_id: string; goals: number; assists: number; own_goals: number; yellow_cards: number; red_cards: number; losses: number; goals_conceded: number; matches: number; goalkeeper_matches: number };
export type ChampionshipAward = { id: string; profile_id: string; name: string; category: string; title: string; value: number };
export type ChampionshipDetail = Championship & { entries: Entry[]; matches: ChampionshipMatch[]; standings: Standing[]; general_standings: Standing[]; player_rankings: PlayerRanking[]; statistics_complete: boolean; trophies: ChampionshipAward[] };
export function matchLabel(match: ChampionshipMatch, championship?: Pick<Championship, 'capacity' | 'format'>) {
  if (match.stage === 'league') return `Liga · rodada ${match.round}`;
  if (match.stage === 'groups') return `Grupo ${match.pool}`;
  if (match.stage === 'winners') return match.round === 1 ? 'Semifinal dos vencedores' : 'Final dos vencedores';
  if (match.stage === 'losers') return match.round === 1 ? 'Semifinal dos perdedores' : 'Final dos perdedores';
  if (match.stage === 'grand_final') return 'Final geral';
  if (championship) {
    const entrants = championship.format === 'groups_knockout' ? championship.capacity / 2 : championship.capacity;
    const remaining = entrants / 2 ** (match.round - 1);
    if (remaining === 16) return 'Oitavas de final';
    if (remaining === 8) return 'Quartas de final';
    if (remaining === 4) return 'Semifinais';
    if (remaining === 2) return 'Final';
  }
  return `Mata-mata · rodada ${match.round}`;
}

