import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, ui } from '@/components/fut-ui';
import { gs } from '@/components/group-screen';
import { Choice, styles } from '@/components/event-ui';
import { Participant, Team } from '@/services/lifecycle';

type Assigned = { team: number; goalkeeper: boolean };
export function TeamBuilder({ players, teams, busy, submit }: {
  players: Participant[]; teams: Team[]; busy: boolean; submit: (body: unknown) => Promise<boolean>;
}) {
  const [count, setCount] = useState(Math.min(4, Math.max(3, teams.length)));
  const [manual, setManual] = useState(false);
  const [assignments, setAssignments] = useState<Record<string, Assigned>>(() => Object.fromEntries(
    teams.flatMap((team, index) => team.players.map(p => [p.presence_id, { team: index, goalkeeper: p.role === 'goalkeeper' }]))));
  const sizes = Array.from({ length: count }, (_, team) => players.filter(p => assignments[p.presence_id]?.team === team).length);
  const complete = players.length >= count && players.every(p => assignments[p.presence_id]?.team < count) && sizes.every(Boolean);
  function assign(presence: string, team: number) {
    setAssignments(previous => ({ ...previous, [presence]: { team, goalkeeper: false } }));
  }
  function keeper(presence: string) {
    setAssignments(previous => {
      const chosen = previous[presence];
      if (!chosen) return previous;
      return Object.fromEntries(Object.entries(previous).map(([id, assignment]) => [id, {
        ...assignment, goalkeeper: id === presence ? !chosen.goalkeeper : assignment.team === chosen.team ? false : assignment.goalkeeper,
      }]));
    });
  }
  async function saveManual() {
    const ok = await submit({ mode: 'manual', teams: Array.from({ length: count }, (_, index) => ({
      name: `Time ${index + 1}`, players: players.filter(p => assignments[p.presence_id]?.team === index).map(p => ({
        presence_id: p.presence_id, role: assignments[p.presence_id].goalkeeper ? 'goalkeeper' : 'player',
      })),
    })) });
    if (ok) setManual(false);
  }
  return <View style={gs.card}>
    <Text style={gs.heading}>Monte os times</Text>
    <Text style={ui.body}>{players.length} confirmados disponíveis. Escolha a quantidade de times.</Text>
    <View style={styles.choices}>{[3, 4].filter(n => n <= Math.max(3, players.length)).map(n => <Choice key={n} selected={count === n} disabled={busy} onPress={() => { if (n !== count) { setCount(n); setAssignments({}); } }}>{n} times</Choice>)}</View>
    <Button loading={busy} disabled={players.length < count} onPress={() => { setManual(false); void submit({ mode: 'random', team_count: count }); }}>Sortear jogadores nos times</Button>
    <Choice selected={manual} disabled={busy} onPress={() => setManual(!manual)}>{teams.length ? 'Editar times manualmente' : 'Selecionar jogadores um por um'}</Choice>
    {manual && <>
      <Text style={gs.muted}>Escolha um time para cada pessoa. Marque o goleiro de cada time, se desejar.</Text>
      {players.map(player => <View key={player.presence_id} style={{ gap: 10, paddingVertical: 12 }}>
        <Text style={{ fontWeight: '700' }}>{player.name}{player.is_guest ? ' · convidado' : ''}</Text>
        <View style={styles.choices}>{Array.from({ length: count }, (_, index) => <Choice key={index} selected={assignments[player.presence_id]?.team === index} disabled={busy} onPress={() => assign(player.presence_id, index)}>Time {index + 1}</Choice>)}</View>
        {assignments[player.presence_id] && <Choice selected={assignments[player.presence_id].goalkeeper} disabled={busy} onPress={() => keeper(player.presence_id)}>Goleiro</Choice>}
      </View>)}
      <Text style={ui.body}>{sizes.map((size, index) => `Time ${index + 1}: ${size}`).join(' · ')}</Text>
      <Button onPress={() => void saveManual()} loading={busy} disabled={!complete}>Salvar times selecionados</Button>
    </>}
    {teams.length > 0 && <Text style={gs.muted}>Administradores e donos podem ajustar os times antes de iniciar o evento. Salve as alterações antes de iniciar.</Text>}
  </View>;
}
