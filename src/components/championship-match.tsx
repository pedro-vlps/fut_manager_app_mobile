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

export function ChampionshipMatchCard({ match, data, update, canManage }: { match: ChampionshipMatch; data: ChampionshipDetail; update: (data: ChampionshipDetail) => void; canManage: boolean }) {
  const [winner, setWinner] = useState('');
  const [expanded, setExpanded] = useState(false);
  const action = useMutation();
  const name = (id: string) => data.entries.find(e => e.club_id === id)?.name ?? 'Time';
  const played = match.home_score !== null;
  const waiting = data.format === 'cascade' && data.matches.some(m => m.sequence < match.sequence && m.home_score === null);
  const editable = canManage && !played && !waiting;
  const actions = match.actions ?? [];
  const goals = (id: string) => actions.filter(a => (a.team_id === id && a.action_type === 'goal') || (a.team_id !== id && a.action_type === 'own_goal')).length;
  const home = played ? match.home_score! : goals(match.home_id);
  const away = played ? match.away_score! : goals(match.away_id);
  const tie = home === away;
  const needsWinner = tie && match.stage !== 'groups' && match.stage !== 'league';
  const view: Pick<Match, 'scores' | 'players' | 'actions'> = {
    scores: [match.home_id, match.away_id].map((id, i) => ({ team_id: id, name: name(id), goals: i === 0 ? home : away, result: played ? tie ? 'draw' : match.winner_id === id ? 'win' : 'loss' : null })),
    players: data.entries.filter(e => e.club_id === match.home_id || e.club_id === match.away_id).flatMap(e => e.players.map(p => ({ presence_id: p.id, person_id: p.id, name: p.name, team_id: e.club_id, is_active: true, is_temporary: false, is_guest: false, positions: [], role: 'player' as const }))),
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
    {played && [match.home_goalkeeper_id, match.away_goalkeeper_id].filter(Boolean).map(id => <Text key={id} style={gs.muted}>Goleiro: {view.players.find(player => player.person_id === id)?.name}</Text>)}
    {played && match.winner_id && <Text style={gs.badge}>Vencedor: {name(match.winner_id)}</Text>}
    {editable && <>
      <Text style={gs.heading}>Goleiros da partida</Text>
      <Text style={gs.muted}>Indique quem jogou no gol de cada time para registrar os gols sofridos. A escolha é salva para esta partida.</Text>
      {(['home', 'away'] as const).map(side => {
        const clubId = side === 'home' ? match.home_id : match.away_id;
        const field = side === 'home' ? 'home_goalkeeper_id' : 'away_goalkeeper_id';
        return <Dropdown key={side} label={`Goleiro do ${name(clubId)}`} value={match[field] ?? ''} disabled={action.busy}
          options={[{ value: '', label: 'Sem goleiro indicado' }, ...(data.entries.find(entry => entry.club_id === clubId)?.players ?? []).map(player => ({ value: player.id, label: player.name }))]}
          onChange={value => { void action.mutate<ChampionshipDetail>(`${base}/goalkeepers`, {
            home_goalkeeper_id: match.home_goalkeeper_id, away_goalkeeper_id: match.away_goalkeeper_id,
            [field]: value || null,
          }, update); }} />;
      })}
      <ActionForm match={view} busy={action.busy} submit={async body => {
        const ok = await action.mutate<ChampionshipDetail>(`${base}/actions`, body, update);
        if (ok) setWinner('');
        return ok;
      }} />
      <Text style={gs.muted}>Cada lance é salvo na súmula e atualiza o placar. Não inclua gols da disputa de pênaltis.</Text>
    </>}
    {played && <Choice selected={expanded} onPress={() => setExpanded(!expanded)}>Ver súmula da partida</Choice>}
    {(!played || expanded) && <MatchLog match={view} busy={action.busy} remove={editable ? id => {
      void action.mutate<ChampionshipDetail>(`${base}/actions/${id}/remove`, {}, updated => { setWinner(''); update(updated); });
    } : undefined} />}
    {played && expanded && !actions.length && (home > 0 || away > 0) && <Text style={gs.muted}>Este resultado foi registrado sem uma súmula de lances.</Text>}
    {editable ? <>
      <Text style={gs.heading}>Finalizar partida</Text>
      <Text style={ui.body}>{needsWinner ? 'Placar empatado. Escolha quem venceu o desempate para avançar.' : tie ? 'O empate será registrado na classificação.' : `${name(home > away ? match.home_id : match.away_id)} vence pelo placar. Confirme abaixo para registrar o resultado.`}</Text>
      {needsWinner && <View style={styles.choices}>{view.scores.map(s => <Choice key={s.team_id} selected={winner === s.team_id} disabled={action.busy} onPress={() => setWinner(s.team_id)}>{s.name} avança</Choice>)}</View>}
      {invalidAssists && <Text accessibilityRole="alert" style={ui.error}>Confira as assistências: cada uma deve corresponder a um gol de outro jogador do mesmo time.</Text>}
      <Button loading={action.busy} disabled={(needsWinner && !winner) || invalidAssists} onPress={() => void action.mutate<ChampionshipDetail>(`${base}/score`, { home_score: home, away_score: away, winner_id: needsWinner ? winner : null, action_ids: actions.map(a => a.id) }, update)}>Confirmar resultado</Button>
    </> : !played && <Text style={ui.body}>{waiting ? 'Aguardando o jogo anterior para respeitar o descanso.' : 'Aguardando resultado.'}</Text>}
    {action.error && <Text accessibilityRole="alert" style={ui.error}>{action.error}</Text>}
  </View>;
}

