import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, palette, ui } from '@/components/fut-ui';
import { Empty, GroupScreen, gs } from '@/components/group-screen';
import { useAuth } from '@/contexts/auth';
import { useApiResource } from '@/hooks/use-api-resource';
import { ApiError, request } from '@/services/api';
import { eventDate, eventStatuses, Overview, Presence } from '@/services/groups';

export default function GroupPage() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  return <GroupContent key={groupId} groupId={groupId} />;
}

function GroupContent({ groupId }: { groupId: string }) {
  const resource = useApiResource<Overview>(`/my-groups/${groupId}`);
  const { session, expireSession } = useAuth();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; error: boolean }>();
  const submitting = useRef(false);
  const alive = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const event = resource.data?.next_event;
  async function confirm() {
    if (!event || !session || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setFeedback(undefined);
    try {
      const result = await request<Presence>(`/my-groups/${groupId}/events/${event.id}/confirm`, { method: 'POST' }, session.access_token);
      if (!alive.current) return;
      setFeedback({ message: result.status === 'waitlist' ? `Você entrou na lista de espera. Posição: ${result.waitlist_position ?? 'a definir'}.` : 'Presença confirmada! Nos vemos em campo.', error: false });
      await resource.refresh();
    } catch (error) {
      if (!alive.current) return;
      if (error instanceof ApiError && error.status === 401) expireSession();
      else setFeedback({ message: error instanceof Error ? error.message : 'Não foi possível confirmar.', error: true });
    } finally { submitting.current = false; if (alive.current) setBusy(false); }
  }
  const presence = event?.my_presence;
  return <GroupScreen title={resource.data?.group.name ?? 'Seu grupo'} subtitle={resource.data?.group.description ?? undefined} {...resource}>
    <View style={gs.card}>
      <Text style={ui.eyebrow}>{event?.status === 'in_progress' ? 'EVENTO EM ANDAMENTO' : 'EVENTO DO GRUPO'}</Text>
      {event ? <>
        <Text style={gs.heading}>{event.title}</Text>
        <Text style={[ui.body, { color: palette.ink, fontWeight: '600' }]}>{eventDate(event.scheduled_at)}</Text>
        <Text style={ui.body}>{event.location || 'Local a definir'}</Text>
        <Text style={gs.badge}>{eventStatuses[event.status]}</Text>
        <Button onPress={() => router.push({ pathname: '/groups/[groupId]/event', params: { groupId, eventId: event.id } })}>{event.status === 'in_progress' ? 'Acompanhar evento e partidas' : 'Abrir evento · times e partidas'}</Button>
        <Text style={ui.body}>{event.confirmed_count}{event.max_confirmed_players ? ` de ${event.max_confirmed_players}` : ''} presenças confirmadas</Text>
        {presence?.status === 'confirmed' && <Text style={gs.success}>Sua presença está confirmada.</Text>}
        {presence?.status === 'waitlist' && <Text style={gs.success}>Você está na lista de espera · posição {presence.waitlist_position ?? 'a definir'}.</Text>}
        {event.confirmation_message && <Text style={gs.muted}>{event.confirmation_message}</Text>}
        <Button onPress={confirm} loading={busy} disabled={!event.can_confirm || resource.refreshing}>{presence?.status === 'confirmed' ? 'Presença confirmada' : presence?.status === 'waitlist' ? 'Na lista de espera' : event.max_confirmed_players && event.confirmed_count >= event.max_confirmed_players ? 'Entrar na lista de espera' : 'Confirmar presença'}</Button>
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/groups/[groupId]/confirmed', params: { groupId, eventId: event.id } })} style={gs.back}><Text style={[gs.link, { textAlign: 'center' }]}>Ver lista de confirmados →</Text></Pressable>
      </> : <Text style={ui.body}>Ainda não há um próximo evento agendado. Assim que a turma marcar, ele aparece aqui.</Text>}
    </View>
    {feedback && <Text accessibilityRole="alert" style={feedback.error ? ui.error : gs.success}>{feedback.message}</Text>}
    <Text style={gs.heading}>Explore o grupo</Text>
    {([
      ['history', 'Histórico de eventos', 'Confira as datas e os participantes das peladas.'],
      ['rankings', 'Rankings do grupo', 'Gols, assistências, vitórias e muito mais.'],
      ['members', 'Membros do grupo', 'Conheça quem faz parte da sua turma.'],
    ] as const).map(([page, title, subtitle]) => <Pressable key={page} accessibilityRole="button" onPress={() => router.push({ pathname: `/groups/[groupId]/${page}`, params: { groupId } })} style={({ pressed }) => [gs.card, { opacity: pressed ? 0.65 : 1 }]}>
      <View style={gs.row}><Text style={[gs.heading, { flex: 1 }]}>{title}</Text><Text style={gs.link}>→</Text></View><Text style={ui.body}>{subtitle}</Text>
    </Pressable>)}
    {!event && <Empty>Enquanto isso, confira os membros e os rankings do grupo.</Empty>}
  </GroupScreen>;
}
