import { useState } from 'react';
import { Text, View } from 'react-native';
import { gs } from '@/components/group-screen';
import { Button, ui } from '@/components/fut-ui';
import { Choice, MatchLog, Scoreboard, styles } from '@/components/event-ui';
import { ActionForm } from '@/components/match-controls';
import { useMutation } from '@/hooks/use-mutation';
import { ChampionshipDetail, ChampionshipMatch, matchLabel } from '@/services/championships';
import { Match } from '@/services/lifecycle';
import { Dropdown } from '@/components/dropdown';
import { useAuth } from '@/contexts/auth';
import { ChampionshipStartingGoalkeeper } from './championship-starting-goalkeeper';

export function ChampionshipMatchCard({ match, data, update, canManage }: { match: ChampionshipMatch; data: ChampionshipDetail; update: (data: ChampionshipDetail) => void; canManage: boolean }) {
  const [winner, setWinner] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [replacement, setReplacement] = useState<Partial<Record<'home' | 'away', string>>>({});
  const action = useMutation();
  const { session } = useAuth();
  const name = (id: string) => data.entries.find(e => e.club_id === id)?.name ?? 'Time';
  const played = match.home_score !== null;
  const waiting = data.format === 'cascade' && data.matches.some(m => m.sequence < match.sequence && m.home_score === null);
  const editable = canManage && !played && !waiting;
  const actions = match.actions ?? [];
  const started = !!match.started_at || actions.length > 0;
  const history = match.goalkeeper_history ?? [];
  const goals = (id: string) => actions.filter(a => (a.team_id === id && a.action_type === 'goal') || (a.team_id !== id && a.action_type === 'own_goal')).length;
  const home = played ? match.home_score! : goals(match.home_id);
  const away = played ? match.away_score! : goals(match.away_id);
  const tie = home === away;
  const needsWinner = tie && match.stage !== 'groups' && match.stage !== 'league';
  const view: Pick<Match, 'scores' | 'players' | 'actions'> = {
    scores: [match.home_id, match.away_id].map((id, i) => ({ team_id: id, name: name(id), goals: i === 0 ? home : away, result: played ? tie ? 'draw' : match.winner_id === id ? 'win' : 'loss' : null })),
    players: data.entries.filter(e => e.club_id === match.home_id || e.club_id === match.away_id).flatMap(e => e.players.map(p => ({ presence_id: p.id, person_id: p.id, name: p.name, jersey_number: p.jersey_number, team_id: e.club_id, is_active: true, is_temporary: false, is_guest: false, positions: [], role: 'player' as const }))),
    actions,
  };
  const invalidAssists = view.scores.some(s => {
    const teamGoals = actions.filter(a => a.team_id === s.team_id && a.action_type === 'goal').length;
    const assists = actions.filter(a => a.team_id === s.team_id && a.action_type === 'assist');
    return assists.length > teamGoals || view.players.filter(p => p.team_id === s.team_id).some(p =>
      assists.filter(a => a.presence_id === p.presence_id).length > teamGoals - actions.filter(a => a.presence_id === p.presence_id && a.action_type === 'goal').length);
  });
  const base = `/championships/${data.id}/matches/${match.id}`;
  return <View style={gs.card}>
    <Text style={gs.badge}>Jogo {match.sequence} · {matchLabel(match, data)}</Text>
    <Scoreboard match={view} />
    {[match.home_goalkeeper_id, match.away_goalkeeper_id].filter(Boolean).map(id => <Text key={id} style={gs.muted}>{played ? 'Último goleiro' : 'Goleiro'}: {view.players.find(player => player.person_id === id)?.name}</Text>)}
    {!played && !started && data.entries.filter(entry => entry.owner_id === session?.profile.id && (entry.club_id === match.home_id || entry.club_id === match.away_id)).map(entry =>
      <ChampionshipStartingGoalkeeper key={entry.id} data={data} entry={entry} update={update} />)}
    {match.walkover && <Text style={gs.badge}>Resultado por WO · sem gols individuais</Text>}
    {played && match.winner_id && <Text style={gs.badge}>Vencedor: {name(match.winner_id)}</Text>}
    {editable && <>
      <Text style={gs.heading}>{started ? 'Substituição de goleiro' : 'Goleiros da partida'}</Text>
      <Text style={gs.muted}>{started ? 'Registre a troca comunicada pelo time. Cada gol sofrido continuará com o goleiro que estava no gol no momento do lance.' : 'Os titulares já foram preenchidos pelos times. Ajuste apenas se necessário e confirme o início da partida.'}</Text>
      {(['home', 'away'] as const).map(side => {
        const clubId = side === 'home' ? match.home_id : match.away_id;
        const field = side === 'home' ? 'home_goalkeeper_id' : 'away_goalkeeper_id';
        return <View key={side} style={{ gap: 8 }}><Dropdown label={`${started ? 'Substituir goleiro do' : 'Goleiro do'} ${name(clubId)}`} value={(started ? replacement[side] : undefined) ?? match[field] ?? ''} disabled={action.busy}
          options={[...(!started ? [{ value: '', label: 'Sem goleiro indicado' }] : []), ...(data.entries.find(entry => entry.club_id === clubId)?.players ?? []).map(player => ({ value: player.id, label: player.name }))]}
          onChange={value => { if (started) { setReplacement(current => ({ ...current, [side]: value })); return; } void action.mutate<ChampionshipDetail>(`${base}/goalkeepers`, {
            home_goalkeeper_id: match.home_goalkeeper_id, away_goalkeeper_id: match.away_goalkeeper_id,
            [field]: value || null,
          }, update); }} />
          {started && replacement[side] !== undefined && replacement[side] !== match[field] && <>
            <Text style={gs.muted}>Substituição ainda não confirmada. Confirme quando o jogador entrar no gol.</Text>
            <Button loading={action.busy} onPress={() => void action.mutate<ChampionshipDetail>(`${base}/goalkeepers`, { [field]: replacement[side] }, result => { setReplacement(current => ({ ...current, [side]: undefined })); update(result); })}>Confirmar substituição do {name(clubId)}</Button>
            <Button disabled={action.busy} onPress={() => setReplacement(current => ({ ...current, [side]: undefined }))}>Cancelar troca</Button>
          </>}
        </View>;
      })}
      {!started && <Button loading={action.busy} onPress={() => void action.mutate<ChampionshipDetail>(`${base}/kickoff`, {}, update)}>Iniciar partida com estes goleiros</Button>}
      {started && <ActionForm match={view} busy={action.busy} submit={async body => {
        const ok = await action.mutate<ChampionshipDetail>(`${base}/actions`, body, update);
        if (ok) setWinner('');
        return ok;
      }} />}
      <Text style={gs.muted}>Cada lance é salvo na súmula e atualiza o placar. Não inclua gols da disputa de pênaltis.</Text>
    </>}
    {history.length > 0 && (!played || expanded) && <View style={{ gap: 6 }}>
      <Text style={gs.heading}>Histórico de goleiros</Text>
      {history.filter(stint => stint.profile_id).map((stint, index) => <Text key={`${stint.team_id}-${index}`} style={gs.muted}>{name(stint.team_id)} · {view.players.find(player => player.person_id === stint.profile_id)?.name}</Text>)}
    </View>}
    {played && <Choice selected={expanded} onPress={() => setExpanded(!expanded)}>Ver súmula da partida</Choice>}
    {(!played || expanded) && <MatchLog match={view} busy={action.busy} remove={editable ? id => {
      void action.mutate<ChampionshipDetail>(`${base}/actions/${id}/remove`, {}, updated => { setWinner(''); update(updated); });
    } : undefined} />}
    {played && expanded && !actions.length && (home > 0 || away > 0) && <Text style={gs.muted}>Este resultado foi registrado sem uma súmula de lances.</Text>}
    {editable ? <>
      <Text style={gs.heading}>Vitória por WO</Text>
      <Text style={gs.muted}>Escolha o time presente antes de iniciar a partida. O resultado será 3 a 0, sem estatísticas individuais.</Text>
      {view.scores.map(team => <Button key={team.team_id} loading={action.busy} disabled={started} onPress={() => void action.mutate<ChampionshipDetail>(`${base}/score`, { home_score: team.team_id === match.home_id ? 3 : 0, away_score: team.team_id === match.away_id ? 3 : 0, winner_id: team.team_id, walkover: true }, update)}>{team.name} vence por WO</Button>)}
      <Text style={gs.heading}>Finalizar partida</Text>
      <Text style={ui.body}>{needsWinner ? 'Placar empatado. Escolha quem venceu o desempate para avançar.' : tie ? 'O empate será registrado na classificação.' : `${name(home > away ? match.home_id : match.away_id)} vence pelo placar. Confirme abaixo para registrar o resultado.`}</Text>
      {needsWinner && <View style={styles.choices}>{view.scores.map(s => <Choice key={s.team_id} selected={winner === s.team_id} disabled={action.busy} onPress={() => setWinner(s.team_id)}>{s.name} avança</Choice>)}</View>}
      {invalidAssists && <Text accessibilityRole="alert" style={ui.error}>Confira as assistências: cada uma deve corresponder a um gol de outro jogador do mesmo time.</Text>}
      <Button loading={action.busy} disabled={!started || (needsWinner && !winner) || invalidAssists} onPress={() => void action.mutate<ChampionshipDetail>(`${base}/score`, { home_score: home, away_score: away, winner_id: needsWinner ? winner : null, action_ids: actions.map(a => a.id) }, update)}>Confirmar resultado</Button>
    </> : !played && <Text style={ui.body}>{waiting ? 'Aguardando o jogo anterior para respeitar o descanso.' : 'Aguardando resultado.'}</Text>}
    {action.error && <Text accessibilityRole="alert" style={ui.error}>{action.error}</Text>}
  </View>;
}

