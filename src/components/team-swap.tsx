import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, ui } from '@/components/fut-ui';
import { Dropdown } from '@/components/dropdown';
import { gs } from '@/components/group-screen';
import { Team } from '@/services/lifecycle';

export function TeamSwap({ teams, separate = false, busy, submit }: {
  teams: Team[]; separate?: boolean; busy: boolean; submit: (body: unknown) => Promise<boolean>;
}) {
  const [firstTeamId, setFirstTeamId] = useState('');
  const [firstPlayerId, setFirstPlayerId] = useState('');
  const [secondTeamId, setSecondTeamId] = useState('');
  const [secondPlayerId, setSecondPlayerId] = useState('');
  const firstTeam = teams.find(t => t.id === firstTeamId);
  const secondTeam = teams.find(t => t.id === secondTeamId && t.id !== firstTeamId);
  const first = firstTeam?.players.find(p => p.presence_id === firstPlayerId);
  const second = secondTeam?.players.find(p => p.presence_id === secondPlayerId);
  function reset() { setFirstTeamId(''); setFirstPlayerId(''); setSecondTeamId(''); setSecondPlayerId(''); }
  async function swap() {
    if (!firstTeam || !secondTeam || !first || !second || busy || (separate && first.role !== second.role)) return;
    const ok = await submit({ mode: 'manual', teams: teams.map(team => ({
      name: team.name,
      players: team.players.map(player => ({
        presence_id: team.id === firstTeam.id && player.presence_id === first.presence_id ? second.presence_id
          : team.id === secondTeam.id && player.presence_id === second.presence_id ? first.presence_id : player.presence_id,
        role: player.role,
      })),
    })) });
    if (ok) reset();
  }
  const playerOptions = (team: Team) => team.players.filter(p => !separate || team.id === firstTeamId || !first || p.role === first.role).map(p => ({ value: p.presence_id, label: `${p.name} · ${p.positions.length ? p.positions.join(', ') : 'Sem posição cadastrada nesta modalidade'}${p.role === 'goalkeeper' ? ' · Escalado como goleiro' : ''}` }));
  return <View style={{ gap: 16 }}>
    <Text style={gs.heading}>Trocar jogadores de time</Text>
    {separate && <Text style={gs.muted}>As trocas são entre pessoas da mesma função confirmada.</Text>}
    <Dropdown label="1. Escolha um time" placeholder="Escolher time" value={firstTeam?.id ?? ''} disabled={busy}
      options={teams.map(t => ({ value: t.id, label: t.name }))}
      onChange={value => { setFirstTeamId(value); setFirstPlayerId(''); setSecondTeamId(''); setSecondPlayerId(''); }} />
    {firstTeam && <Dropdown label="2. Escolha o jogador" placeholder="Escolher jogador" value={first?.presence_id ?? ''} disabled={busy}
      options={playerOptions(firstTeam)} onChange={value => { setFirstPlayerId(value); setSecondTeamId(''); setSecondPlayerId(''); }} />}
    {first && <Dropdown label="3. Escolha o outro time" placeholder="Escolher outro time" value={secondTeam?.id ?? ''} disabled={busy}
      options={teams.filter(t => t.id !== firstTeamId).map(t => ({ value: t.id, label: t.name }))}
      onChange={value => { setSecondTeamId(value); setSecondPlayerId(''); }} />}
    {first && secondTeam && <Dropdown label="4. Escolha quem entra na troca" placeholder="Escolher jogador" value={second?.presence_id ?? ''} disabled={busy}
      options={playerOptions(secondTeam)} onChange={setSecondPlayerId} />}
    {first && second && <>
      <Text style={ui.body}>{first.name} vai para {secondTeam?.name} e {second.name} vai para {firstTeam?.name}.</Text>
      {first.role !== second.role && <Text style={gs.muted}>Cada jogador assume a função do outro nesta formação, inclusive a posição de goleiro.</Text>}
      <Button loading={busy} onPress={() => void swap()}>Confirmar troca</Button>
    </>}
    {firstTeam && <Button disabled={busy} onPress={reset}>Cancelar troca</Button>}
  </View>;
}
