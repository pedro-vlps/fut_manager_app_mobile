import { Group } from './api';

export type Presence = { id: string; status: 'registered' | 'confirmed' | 'waitlist' | 'cancelled' | 'absent'; waitlist_position: number | null };
export type Event = {
  id: string; title: string; location: string | null; scheduled_at: string;
  status: 'draft' | 'registration_open' | 'registration_closed' | 'in_progress' | 'finished' | 'cancelled';
  max_confirmed_players: number | null;
};
export type NextEvent = Event & { confirmed_count: number; my_presence: Presence | null; can_confirm: boolean; confirmation_message: string | null };
export type Overview = { group: Omit<Group, 'role'>; next_event: NextEvent | null; can_manage: boolean };
export type DiscoveredGroup = { id: string; code: string; name: string; description: string | null; membership: 'active' | 'blocked' | 'none'; request_status: 'pending' | 'approved' | 'rejected' | null };
export type JoinRequest = { id: string; profile_id: string; name: string; created_at: string; status: 'pending' | 'approved' | 'rejected' };
export type Person = { id: string; name: string; role: string | null; is_guest: boolean };
export type Ranking = Person & { goals: number; own_goals: number; assists: number; yellow_cards: number; red_cards: number; wins: number; losses: number; goals_conceded: number; matches: number; goalkeeper_matches: number };
export const eventStatuses = { draft: 'Rascunho', registration_open: 'Inscrições abertas', registration_closed: 'Inscrições encerradas', in_progress: 'Em andamento', finished: 'Finalizado', cancelled: 'Cancelado' };
export const roleNames: Record<string, string> = { owner: 'Organizador', admin: 'Administrador', member: 'Jogador' };
export function eventDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
