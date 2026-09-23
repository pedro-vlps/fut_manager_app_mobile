import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Button, ui } from '@/components/fut-ui';
import { Empty, GroupScreen, gs } from '@/components/group-screen';
import { Choice, MatchLog, Scoreboard, TeamCards, styles } from '@/components/event-ui';
import { TeamBuilder } from '@/components/team-builder';
import { MatchTimer } from '@/components/match-timer';
import { ActionForm, FinishForm } from '@/components/match-controls';
import { useAuth } from '@/contexts/auth';
import { useApiResource } from '@/hooks/use-api-resource';
import { ApiError, request } from '@/services/api';
import { eventDate, eventStatuses } from '@/services/groups';
import { Lifecycle } from '@/services/lifecycle';

export default function EventPage() {
  const { groupId, eventId, readOnly } = useLocalSearchParams<{ groupId: string; eventId: string; readOnly?: string }>();
  return <EventContent key={`${groupId}:${eventId}:${readOnly}`} groupId={groupId} eventId={eventId} readOnly={readOnly === '1'} />;
}

function EventContent({ groupId, eventId, readOnly }: { groupId: string; eventId: string; readOnly: boolean }) {
  const base = `/my-groups/${groupId}/events/${eventId}`;
  const resource = useApiResource<Lifecycle>(`${base}/lifecycle`);
  const { session, expireSession } = useAuth();
  const [busy, setBusy] = useState(false);
  const [timerBusy, setTimerBusy] = useState(false);
  const [timerError, setTimerError] = useState('');
  const [message, setMessage] = useState<{ text: string; error: boolean }>();
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const working = useRef(false);
  const alive = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  async function mutate(path: string, body: unknown, success: string, timerOnly = false) {
    if (!session || working.current || readOnly || !resource.data?.can_manage) return false;
    working.current = true;
    if (timerOnly) { setTimerBusy(true); setTimerError(''); }
    else { setBusy(true); setMessage(undefined); }
    try {
      const data = await request<Lifecycle>(`${base}${path}`, { method: 'POST', body: JSON.stringify(body) }, session.access_token);
      if (!alive.current) return false;
      resource.update(data);
      if (!timerOnly) setMessage({ text: success, error: false });
      return true;
    } catch (error) {
      if (!alive.current) return false;
      if (error instanceof ApiError && error.status === 401) expireSession();
      else if (timerOnly) setTimerError(error instanceof Error ? error.message : 'Não foi possível atualizar o cronômetro.');
      else setMessage({ text: error instanceof Error ? error.message : 'Não foi possível salvar.', error: true });
      return false;
    } finally { working.current = false; if (alive.current) { if (timerOnly) setTimerBusy(false); else setBusy(false); } }
  }
  const data = resource.data;
  const event = data?.event;
  const match = data?.current_match;
  const terminal = event?.status === 'finished' || event?.status === 'cancelled';
  const editable = !!data?.can_manage && !terminal && !readOnly;
  const disabled = busy || resource.refreshing;
  const minimum = Math.max(3, event?.min_confirmed_players ?? 0);
  const roster = data?.teams.flatMap(t => t.players.map(p => p.presence_id)) ?? [];
  const teamsReady = !!data && data.teams.length >= 3 && data.teams.length <= 4 && data.teams.every(t => t.players.length > 0)
    && roster.length === data.participants.length && new Set(roster).size === roster.length
    && data.participants.every(p => roster.includes(p.presence_id));
  const selectedValid = selected.filter(id => data?.teams.some(t => t.id === id));
  function selectTeam(id: string) {
    setSelected(previous => previous.includes(id) ? previous.filter(i => i !== id) : [...previous.filter(i => data?.teams.some(t => t.id === i)).slice(-1), id]);
  }
  return <GroupScreen title={event?.title ?? 'Evento'} subtitle={event ? `${eventDate(event.scheduled_at)} · ${event.location || 'Local a definir'}` : undefined} {...resource} refreshing={resource.refreshing || busy} refresh={() => { if (!working.current) void resource.refresh(); }}>
    {message && <Text accessibilityRole="alert" style={message.error ? ui.error : gs.success}>{message.text}</Text>}
    {data && <>
      <View style={gs.card}>
        <Text style={ui.eyebrow}>{eventStatuses[data.event.status]}</Text>
        <Text style={ui.body}>{data.participants.length} confirmados · {data.teams.length} times · mínimo de {minimum} jogadores</Text>
        {(terminal || readOnly) ? <Text style={gs.success}>Somente consulta · partidas, súmulas e jogadores preservados.</Text> : !data.can_manage && <Text style={gs.muted}>Você está acompanhando o evento. A organização controla os times e a súmula.</Text>}
        {editable && event?.status !== 'in_progress' && <Button loading={busy} disabled={disabled || !teamsReady || data.participants.length < minimum} onPress={() => void mutate('/start', {}, 'Evento iniciado. Escolha o primeiro confronto.')}>Iniciar evento</Button>}
        {editable && event?.status !== 'in_progress' && !teamsReady && <Text style={ui.body}>Sorteie ou selecione os times e salve a formação para liberar o início do evento.</Text>}
        {editable && data.participants.length < minimum && <Text style={ui.body}>Faltam {minimum - data.participants.length} confirmações para iniciar.</Text>}
      </View>
      {editable && event?.status !== 'in_progress' && data.matches.length === 0 && <TeamBuilder key={data.teams.map(t => t.id).join(':')} players={data.participants} teams={data.teams} busy={disabled} submit={body => mutate('/teams', body, 'Times salvos. Confira a escalação abaixo.')} />}
      {editable && event?.status === 'in_progress' && data.matches.length === 0 && data.teams.length >= 3 && <View style={gs.card}>
        <Text style={gs.heading}>Quem começa jogando?</Text><Text style={ui.body}>Selecione dois times. Os demais aguardam na fila.</Text>
        <View style={styles.choices}>{data.teams.map(team => <Choice key={team.id} selected={selectedValid.includes(team.id)} disabled={disabled} onPress={() => selectTeam(team.id)}>{team.name}</Choice>)}</View>
        <Button loading={busy} disabled={disabled || selectedValid.length !== 2} onPress={() => void mutate('/kickoff', { mode: 'manual', team_ids: selectedValid }, 'Primeira partida iniciada!')}>Iniciar com os dois times escolhidos</Button>
        <Button loading={busy} disabled={disabled} onPress={() => void mutate('/kickoff', { mode: 'random' }, 'Confronto sorteado e partida iniciada!')}>Sortear os dois times iniciais</Button>
      </View>}
      {match && <>
        <View style={gs.card}><Text style={ui.eyebrow}>PARTIDA {match.sequence} · EM ANDAMENTO</Text>
          <MatchTimer match={match} busy={disabled || timerBusy} error={timerError} control={editable ? action => void mutate(`/matches/${match.id}/timer`, { action }, '', true) : undefined} />
          <Scoreboard match={match} />
          {editable && <ActionForm key={match.id} match={match} teams={data.teams} busy={disabled} submit={body => mutate(`/matches/${match.id}/actions`, body, 'Lance registrado.')} />}
        </View>
        <View style={gs.card}><MatchLog match={match} busy={disabled} remove={editable ? id => void mutate(`/matches/${match.id}/actions/${id}/remove`, {}, 'Lance removido e placar atualizado.') : undefined} /></View>
        {editable && <FinishForm key={match.id} match={match} busy={disabled} submit={body => mutate(`/matches/${match.id}/finish`, body, 'Resultado salvo. Confira a próxima partida ou o encerramento abaixo.')} />}
      </>}
      {data.waiting_team_ids.length > 0 && <View style={gs.card}><Text style={gs.heading}>Na próxima</Text>{data.waiting_team_ids.map((id, index) => <Text key={id} style={ui.body}>{index + 1}. {data.teams.find(t => t.id === id)?.name ?? 'Time'}</Text>)}<Text style={gs.muted}>Quem avança fica em campo. O primeiro da fila entra e quem perde vai para o fim.</Text></View>}
      {data.teams.length > 0 && <><Text style={gs.heading}>Times e jogadores</Text><TeamCards teams={data.teams} /></>}
      {data.matches.some(m => m.status === 'finished') && <Text style={gs.heading}>Partidas finalizadas</Text>}
      {data.matches.filter(m => m.status === 'finished').map(past => <View key={past.id} style={gs.card}>
        <Text style={gs.badge}>Partida {past.sequence}</Text><Scoreboard match={past} />
        {past.advancing_team_id && <Text style={ui.body}>Avançou: {data.teams.find(t => t.id === past.advancing_team_id)?.name}</Text>}
        <Choice selected={expanded === past.id} onPress={() => setExpanded(expanded === past.id ? null : past.id)}>Ver súmula da partida</Choice>
        {expanded === past.id && <MatchLog match={past} busy={false} />}
      </View>)}
      {terminal && data.matches.length === 0 && <Empty>Este evento não possui partidas registradas.</Empty>}
      {editable && event?.status === 'in_progress' && !match && <Button loading={busy} onPress={() => void mutate('/finish', {}, 'Evento encerrado.')}>Encerrar evento sem partida em andamento</Button>}
    </>}
  </GroupScreen>;
}
