import { Group } from './api';

export type Presence = { id: string; role: 'player' | 'goalkeeper'; status: 'registered' | 'confirmed' | 'waitlist' | 'cancelled' | 'absent'; waitlist_position: number | null };
export type Event = {
  modality: 'campo' | 'futsal' | 'fut7' | null;
  id: string; title: string; location: string | null; scheduled_at: string;
  registration_opens_at?: string | null; registration_closes_at?: string | null;
  schedule_timezone?: string; recurring_weekly?: boolean;
  status: 'draft' | 'registration_open' | 'registration_closed' | 'in_progress' | 'finished' | 'cancelled';
  max_confirmed_players: number | null;
  min_confirmed_players: number | null;
  min_confirmed_goalkeepers: number | null;
  max_confirmed_goalkeepers: number | null;
};
export type NextEvent = Event & { confirmed_count: number; confirmed_players_count: number; confirmed_goalkeepers_count: number; my_presence: Presence | null; can_confirm: boolean; can_change_role: boolean; can_cancel_confirmation: boolean; confirmation_message: string | null };
export type Overview = { group: Omit<Group, 'role'>; next_event: NextEvent | null; can_manage: boolean };
export type DiscoveredGroup = { id: string; code: string | null; name: string; description: string | null; membership: 'active' | 'blocked' | 'none'; request_status: 'pending' | 'approved' | 'rejected' | null };
export type JoinRequest = { id: string; profile_id: string; name: string; created_at: string; status: 'pending' | 'approved' | 'rejected' };
export type Season = { id: string; number: number; starts_at: string; ends_at: string };
export type SeasonSettings = { mode: 'days' | 'months' | 'fixed'; months: number; day: number; fixed_end: string | null; timezone: string; enabled: boolean; duration_days: number; current_season: Season | null; can_manage: boolean };
export type SeasonRankings = { season: Season | null; rankings: Ranking[] };
export type Person = { id: string; name: string; role: string | null; is_guest: boolean };
export type Ranking = Person & { goals: number; own_goals: number; assists: number; yellow_cards: number; red_cards: number; wins: number; draws: number; points: number; losses: number; goals_conceded: number; matches: number; goalkeeper_matches: number };
export const eventStatuses = { draft: 'Rascunho', registration_open: 'Inscrições abertas', registration_closed: 'Inscrições encerradas', in_progress: 'Em andamento', finished: 'Finalizado', cancelled: 'Cancelado' };
export const roleNames: Record<string, string> = { owner: 'Organizador', admin: 'Administrador', member: 'Jogador' };
export function eventDate(value: string, timeZone?: string) {
  return new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone });
}

export type ConfirmedPerson = Person & { can_cancel_confirmation: boolean };
