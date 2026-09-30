import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Button, ui } from '@/components/fut-ui';
import { gs } from '@/components/group-screen';
import { Dropdown } from '@/components/dropdown';
import { Choice, styles } from '@/components/event-ui';
import { ActionType, Match, Team, actionLabels, operationId } from '@/services/lifecycle';

export function ActionForm({ match, busy, submit }: {
  match: Match; busy: boolean; submit: (body: unknown) => Promise<boolean>;
}) {
  const [teamId, setTeamId] = useState(match.scores[0]?.team_id ?? '');
  const [playerId, setPlayerId] = useState('');
  const [type, setType] = useState<ActionType>('goal');
  const pending = useRef<{ signature: string; id: string } | null>(null);
  const players = match.players.filter(p => p.team_id === teamId && p.is_active);
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

export function TemporaryPlayerForm({ match, teams, waitingTeamIds, confirmedIds, busy, submit }: {
  match: Match; teams: Team[]; waitingTeamIds: string[]; confirmedIds: string[]; busy: boolean;
  submit: (body: unknown) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [teamId, setTeamId] = useState(match.scores[0]?.team_id ?? '');
  const [playerId, setPlayerId] = useState('');
  const [outgoingId, setOutgoingId] = useState('');
  const [sourceTeamId, setSourceTeamId] = useState('');
  const outgoingPlayers = match.players.filter(p => p.team_id === teamId && p.is_active);
  const outgoing = outgoingPlayers.find(p => p.presence_id === outgoingId);
  const candidates = teams.filter(t => waitingTeamIds.includes(t.id)).flatMap(t =>
    t.players.filter(p => confirmedIds.includes(p.presence_id) && p.role === outgoing?.role && !match.players.some(m => m.presence_id === p.presence_id))
      .map(p => ({ value: p.presence_id, label: p.name, teamId: t.id })));
  const incoming = candidates.find(p => p.teamId === sourceTeamId && p.value === playerId);
  function reset() { setPlayerId(''); setOutgoingId(''); setSourceTeamId(''); setOpen(false); }
  async function add() {
    if (!outgoing || !incoming || busy) return;
    if (await submit({ team_id: teamId, presence_id: playerId, outgoing_presence_id: outgoing.presence_id })) reset();
  }
  return <View style={{ gap: 12 }}>
    <Choice selected={open} disabled={busy} onPress={() => setOpen(!open)}>Trocar jogador nesta partida</Choice>
    {open && <>
      <Text style={ui.body}>Escolha quem sai e quem entra de um time que está de fora. A troca vale somente nesta partida e mantém a quantidade de jogadores em campo.</Text>
      <Dropdown label="1. Escolha o time em campo" value={teamId} disabled={busy} options={match.scores.map(s => ({ value: s.team_id, label: s.name }))} onChange={value => { setTeamId(value); setOutgoingId(''); setSourceTeamId(''); setPlayerId(''); }} />
      <Dropdown label="2. Quem fica fora nesta partida?" placeholder="Escolher jogador" value={outgoing?.presence_id ?? ''} disabled={busy} options={outgoingPlayers.map(p => ({ value: p.presence_id, label: `${p.name}${p.role === 'goalkeeper' ? ' · Goleiro' : ''}` }))} onChange={value => { setOutgoingId(value); setSourceTeamId(''); setPlayerId(''); }} />
      {outgoing && <Dropdown label="3. Escolha o time de fora" placeholder="Escolher time" value={sourceTeamId} disabled={busy} options={teams.filter(t => candidates.some(p => p.teamId === t.id)).map(t => ({ value: t.id, label: t.name }))} onChange={value => { setSourceTeamId(value); setPlayerId(''); }} />}
      {outgoing && sourceTeamId && <Dropdown label="4. Quem entra na troca?" placeholder="Escolher jogador" value={incoming?.value ?? ''} disabled={busy} options={candidates.filter(p => p.teamId === sourceTeamId)} onChange={setPlayerId} />}
      {outgoing && candidates.length === 0 && <Text style={gs.muted}>Não há substitutos disponíveis da mesma função nos times de fora.</Text>}
      {outgoing && incoming && <>
        <Text style={ui.body}>{incoming.label} entra no lugar de {outgoing.name}. {outgoing.name} fica fora do resultado desta partida, inclusive da vitória. Os lances já registrados continuam na súmula. Na próxima partida, ambos voltam à formação original.</Text>
        <Button loading={busy} onPress={() => void add()}>Confirmar troca temporária</Button>
      </>}
      <Button disabled={busy} onPress={reset}>Cancelar troca</Button>
    </>}
  </View>;
}

export function MatchPlayers({ match }: { match: Match }) {
  return <View style={{ gap: 8 }}>
    <Text style={gs.heading}>Jogadores da partida</Text>
    {match.scores.map(score => <View key={score.team_id} style={{ gap: 4 }}>
      <Text style={gs.badge}>{score.name}</Text>
      {match.players.filter(p => p.team_id === score.team_id).map(p => <Text key={p.presence_id} style={ui.body}>
        {p.name}{p.role === 'goalkeeper' ? ' · Goleiro' : ''}{p.is_temporary ? ' · Temporário' : ''}{!p.is_active ? ' · Fora nesta partida (sem resultado)' : ''}
      </Text>)}
    </View>)}
  </View>;
}
