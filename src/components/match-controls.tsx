import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Button, ui } from '@/components/fut-ui';
import { gs } from '@/components/group-screen';
import { Dropdown } from '@/components/dropdown';
import { Choice, styles } from '@/components/event-ui';
import { ActionType, Match, Team, actionLabels, operationId } from '@/services/lifecycle';

export function ActionForm({ match, teams, busy, submit }: {
  match: Match; teams: Team[]; busy: boolean; submit: (body: unknown) => Promise<boolean>;
}) {
  const [teamId, setTeamId] = useState(match.scores[0]?.team_id ?? '');
  const [playerId, setPlayerId] = useState('');
  const [type, setType] = useState<ActionType>('goal');
  const pending = useRef<{ signature: string; id: string } | null>(null);
  const players = teams.find(t => t.id === teamId)?.players ?? [];
  async function add() {
    const body = { team_id: teamId, presence_id: playerId, action_type: type };
    const signature = JSON.stringify(body);
    if (pending.current?.signature !== signature) pending.current = { signature, id: operationId() };
    const ok = await submit({ ...body, id: pending.current.id });
    if (ok) { pending.current = null; setPlayerId(''); }
  }
  return <View style={{ gap: 16 }}>
    <Text style={gs.heading}>Registrar lance</Text>
    <View style={styles.choices}>{match.scores.map(score => <Choice key={score.team_id} selected={teamId === score.team_id} disabled={busy} onPress={() => { setTeamId(score.team_id); setPlayerId(''); }}>{score.name}</Choice>)}</View>
    <Dropdown key={teamId} label="Quem participou do lance?" placeholder="Selecione o jogador" value={playerId} disabled={busy} options={players.map(p => ({ value: p.presence_id, label: p.name }))} onChange={setPlayerId} />
    <Dropdown label="O que fez?" value={type} disabled={busy} options={Object.entries(actionLabels).map(([value, label]) => ({ value, label }))} onChange={value => setType(value as ActionType)} />
    {type === 'own_goal' && <Text style={ui.body}>Selecione quem fez o gol contra. O gol será somado ao adversário.</Text>}
    <Button onPress={() => void add()} loading={busy} disabled={!players.some(p => p.presence_id === playerId)}>Adicionar {actionLabels[type].toLowerCase()}</Button>
  </View>;
}

export function FinishForm({ match, busy, submit }: {
  match: Match; busy: boolean; submit: (body: unknown) => Promise<boolean>;
}) {
  const [chosen, setChosen] = useState('');
  const [stop, setStop] = useState(false);
  const tied = match.scores.length === 2 && match.scores[0].goals === match.scores[1].goals;
  const leader = [...match.scores].sort((a, b) => b.goals - a.goals)[0];
  const winner = tied ? chosen : leader?.team_id;
  return <View style={gs.card}>
    <Text style={gs.heading}>Finalizar partida</Text>
    <Text style={ui.body}>{tied ? 'Placar empatado. Escolha quem avança ou faça um sorteio. O resultado continuará sendo empate nos rankings.' : `${leader?.name} vence pelo placar. Confirme abaixo para avançar.`}</Text>
    <View style={styles.choices}>{match.scores.map(score => <Choice key={score.team_id} selected={winner === score.team_id} disabled={busy || !tied} onPress={() => setChosen(score.team_id)}>{score.name} {tied ? 'avança' : 'vence'}</Choice>)}</View>
    <Choice selected={stop} disabled={busy} onPress={() => setStop(!stop)}>{stop ? '✓ ' : ''}Encerrar o evento após esta partida</Choice>
    <Button loading={busy} disabled={!winner} onPress={() => void submit({ advancing_team_id: winner, continue_cycle: !stop })}>{stop ? 'Confirmar resultado e encerrar evento' : 'Confirmar resultado e próxima partida'}</Button>
    {tied && <Button loading={busy} onPress={() => void submit({ random_tiebreak: true, continue_cycle: !stop })}>{stop ? 'Sortear desempate e encerrar evento' : 'Sortear desempate e próxima partida'}</Button>}
  </View>;
}
