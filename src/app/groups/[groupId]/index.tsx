import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, palette, ui } from '@/components/fut-ui';
import { Empty, GroupScreen, gs } from '@/components/group-screen';
import { useAuth } from '@/contexts/auth';
import { useApiResource } from '@/hooks/use-api-resource';
import { ApiError, request } from '@/services/api';
import { eventDate, eventStatuses, Overview, Presence } from '@/services/groups';
import { useMutation } from '@/hooks/use-mutation';
import { Dropdown } from '@/components/dropdown';
import { RegistrationWindowInfo } from '@/components/registration-opening';
import { useRegistrationRefresh } from '@/hooks/use-registration-refresh';

export default function GroupPage() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  return <GroupContent key={groupId} groupId={groupId} />;
}

function GroupContent({ groupId }: { groupId: string }) {
  const codeAction = useMutation();
  const resource = useApiResource<Overview>(`/my-groups/${groupId}`);
  const { session, expireSession } = useAuth();
  const [busy, setBusy] = useState(false);
  const [roleChoice, setRoleChoice] = useState<{ eventId: string; role: 'player' | 'goalkeeper' }>();
  const [feedback, setFeedback] = useState<{ message: string; error: boolean }>();
  const submitting = useRef(false);
  const alive = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const event = resource.data?.next_event;
  useRegistrationRefresh(event, resource.refresh);
  const role = roleChoice?.eventId === event?.id ? roleChoice?.role ?? 'player' : event?.my_presence?.role ?? 'player';
  async function confirm(cancel = false) {
    if (!event || !session || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setFeedback(undefined);
    try {
      const result = await request<Presence>(`/my-groups/${groupId}/events/${event.id}/${cancel ? 'cancel-confirmation' : 'confirm'}`, { method: 'POST', ...(cancel ? {} : { body: JSON.stringify({ role }) }) }, session.access_token);
      if (!alive.current) return;
      setFeedback({ message: cancel ? 'Sua confirmação foi removida.' : result.status === 'waitlist' ? `Você entrou na lista de espera. Posição: ${result.waitlist_position ?? 'a definir'}.` : 'Presença confirmada! Nos vemos em campo.', error: false });
      await resource.refresh();
    } catch (error) {
      if (!alive.current) return;
      if (error instanceof ApiError && error.status === 401) expireSession();
      else setFeedback({ message: error instanceof Error ? error.message : 'Não foi possível atualizar sua presença.', error: true });
    } finally { submitting.current = false; if (alive.current) setBusy(false); }
  }
  const presence = event?.my_presence;
  return <GroupScreen title={resource.data?.group.name ?? 'Seu grupo'} subtitle={resource.data?.group.description ?? undefined} {...resource}>
    {resource.data?.can_manage && <View style={gs.card}>
      <Text selectable style={gs.badge}>Código do grupo: {resource.data.group.code}</Text>
      <Button loading={codeAction.busy} onPress={() => void codeAction.mutate<Overview>(`/my-groups/${groupId}/code/rotate`, {}, resource.update)}>Gerar novo código de convite</Button>
      {codeAction.error && <Text style={ui.error}>{codeAction.error}</Text>}
    </View>}
    {resource.data?.can_manage && <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/groups/[groupId]/settings', params: { groupId } })} style={gs.card}>
      <View style={gs.row}><Text style={gs.heading}>Configurações do grupo</Text><Text style={gs.link}>→</Text></View>
      <Text style={ui.body}>Defina se o grupo usa temporadas e a duração de cada período.</Text>
    </Pressable>}
    {resource.data?.can_manage && <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/groups/[groupId]/requests', params: { groupId } })} style={gs.card}>
      <View style={gs.row}><Text style={gs.heading}>Pedidos de entrada</Text><Text style={gs.link}>→</Text></View>
      <Text style={ui.body}>Aceite ou recuse quem quer participar do grupo.</Text>
    </Pressable>}
    <View style={gs.card}>
      <Text style={ui.eyebrow}>{event?.status === 'in_progress' ? 'EVENTO EM ANDAMENTO' : 'EVENTO DO GRUPO'}</Text>
      {event ? <>
        <Text style={gs.heading}>{event.title}</Text>
        <Text style={[ui.body, { color: palette.ink, fontWeight: '600' }]}>{eventDate(event.scheduled_at)}</Text>
        <Text style={ui.body}>{event.location || 'Local a definir'}</Text>
        <Text style={gs.badge}>{event.status === 'registration_open' && event.registration_opens_at && new Date(event.registration_opens_at) > new Date() ? 'Aguardando abertura das confirmações' : eventStatuses[event.status]}</Text>
        <RegistrationWindowInfo event={event} />
        <Button onPress={() => router.push({ pathname: '/groups/[groupId]/event', params: { groupId, eventId: event.id } })}>{event.status === 'in_progress' ? 'Acompanhar evento e partidas' : 'Abrir evento · times e partidas'}</Button>
        {event.min_confirmed_goalkeepers != null ? <>
          <Text style={ui.body}>{event.confirmed_players_count}{event.max_confirmed_players != null ? ` de ${event.max_confirmed_players}` : ''} jogadores de linha · {event.confirmed_goalkeepers_count}{event.max_confirmed_goalkeepers != null ? ` de ${event.max_confirmed_goalkeepers}` : ''} goleiros confirmados</Text>
          <Dropdown label="Confirmar presença como" value={role} options={[{ value: 'player', label: 'Jogador de linha' }, { value: 'goalkeeper', label: 'Goleiro' }]} disabled={busy || resource.refreshing || (!event.can_confirm && !event.can_change_role)} onChange={value => setRoleChoice({ eventId: event.id, role: value as 'player' | 'goalkeeper' })} />
        </> : <Text style={ui.body}>{event.confirmed_count}{event.max_confirmed_players ? ` de ${event.max_confirmed_players}` : ''} presenças confirmadas</Text>}
        {presence?.status === 'confirmed' && <Text style={gs.success}>Sua presença está confirmada{event.min_confirmed_goalkeepers != null ? ` como ${presence.role === 'goalkeeper' ? 'goleiro' : 'jogador de linha'}` : ''}.</Text>}
        {presence?.status === 'waitlist' && <Text style={gs.success}>Você está na lista de espera · posição {presence.waitlist_position ?? 'a definir'}.</Text>}
        {event.confirmation_message && <Text style={gs.muted}>{event.confirmation_message}</Text>}
        <Button onPress={() => confirm()} loading={busy} disabled={resource.refreshing || (!event.can_confirm && !(event.can_change_role && role !== presence?.role))}>{event.can_change_role && role !== presence?.role ? 'Alterar função na lista' : presence?.status === 'confirmed' ? 'Presença confirmada' : presence?.status === 'waitlist' ? 'Na lista de espera' : 'Confirmar presença'}</Button>
        {event.can_cancel_confirmation && <Button onPress={() => confirm(true)} disabled={busy || resource.refreshing}>{presence?.status === 'waitlist' ? 'Sair da lista de espera' : 'Remover minha confirmação'}</Button>}
        {event.can_change_role && role !== presence?.role && <Text style={gs.muted}>A troca libera sua vaga atual. Se as vagas da nova função estiverem preenchidas, você entrará na lista de espera.</Text>}
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/groups/[groupId]/confirmed', params: { groupId, eventId: event.id } })} style={gs.back}><Text style={[gs.link, { textAlign: 'center' }]}>Ver lista de confirmados →</Text></Pressable>
      </> : <Text style={ui.body}>Ainda não há um próximo evento agendado. Assim que a turma marcar, ele aparece aqui.</Text>}
    </View>
    {feedback && <Text accessibilityRole="alert" style={feedback.error ? ui.error : gs.success}>{feedback.message}</Text>}
    <Text style={gs.heading}>Explore o grupo</Text>
    {([
      ['history', 'Histórico de eventos', 'Confira as datas e os participantes das peladas.'],
      ['seasons', 'Histórico de temporadas', 'Veja os rankings e registros dos períodos encerrados.'],
      ['standings', 'Classificação geral', 'Tabela de pontos dos jogadores em todas as peladas.'],
      ['rankings', 'Rankings do grupo', 'Gols, assistências, vitórias e muito mais.'],
      ['members', 'Membros do grupo', 'Conheça quem faz parte da sua turma.'],
    ] as const).map(([page, title, subtitle]) => <Pressable key={page} accessibilityRole="button" onPress={() => router.push({ pathname: `/groups/[groupId]/${page}`, params: { groupId } })} style={({ pressed }) => [gs.card, { opacity: pressed ? 0.65 : 1 }]}>
      <View style={gs.row}><Text style={[gs.heading, { flex: 1 }]}>{title}</Text><Text style={gs.link}>→</Text></View><Text style={ui.body}>{subtitle}</Text>
    </Pressable>)}
    {!event && <Empty>Enquanto isso, confira os membros e os rankings do grupo.</Empty>}
  </GroupScreen>;
}
