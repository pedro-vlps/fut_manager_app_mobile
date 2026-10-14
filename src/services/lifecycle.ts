import { Event } from './groups';

export type ActionType = 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'own_goal';
export type PlayerRole = 'player' | 'goalkeeper';
export type Participant = { jersey_number?: number | null; positions: string[]; presence_id: string; person_id: string; name: string; is_guest: boolean; role: PlayerRole };
export type Team = { id: string; name: string; color: string | null; players: Participant[] };
export type Score = { team_id: string; name: string; goals: number; result: 'win' | 'loss' | 'draw' | null };
export type MatchAction = { id: string; team_id: string; player_name: string; auto_generated?: boolean; person_id?: string; presence_id?: string; action_type: ActionType; minute: number | null };
export type Match = { id: string; sequence: number; status: string; advancing_team_id: string | null; scores: Score[]; players: (Participant & { team_id: string; is_temporary: boolean; is_active: boolean })[]; actions: MatchAction[]; timer_elapsed_ms: number; timer_running: boolean };
export type Lifecycle = {
  event: Event & { min_confirmed_players: number | null; started_at: string | null; finished_at: string | null };
  can_manage: boolean; participants: Participant[]; teams: Team[]; waiting_team_ids: string[];
  current_match: Match | null; matches: Match[];
};
export const actionLabels: Record<ActionType, string> = { goal: 'Gol', assist: 'Assistência', yellow_card: 'Cartão amarelo', red_card: 'Cartão vermelho', own_goal: 'Gol contra' };

// Identificador de deduplicação de uma operação, sem função de credencial.
export function operationId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r & 3) | 8).toString(16);
  });
}

export const modalityOptions = [{ value: "campo", label: "Futebol de Campo" }, { value: "futsal", label: "Futsal" }, { value: "fut7", label: "Fut7" }];
