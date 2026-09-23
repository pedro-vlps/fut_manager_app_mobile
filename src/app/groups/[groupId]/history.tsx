import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { ui } from '@/components/fut-ui';
import { Empty, GroupScreen, gs } from '@/components/group-screen';
import { useApiResource } from '@/hooks/use-api-resource';
import { Event, eventDate, eventStatuses } from '@/services/groups';

export default function History() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const resource = useApiResource<Event[]>(`/my-groups/${groupId}/history`);
  return <GroupScreen title="Histórico de eventos" subtitle="Eventos encerrados. Consulte partidas, gols e jogadores." {...resource}>
    {resource.data?.length === 0 && <Empty>Este grupo ainda não tem eventos no histórico.</Empty>}
    {resource.data?.map(event => <View key={event.id} style={gs.card}>
      <Text style={gs.badge}>{eventStatuses[event.status]}</Text><Text style={gs.heading}>{event.title}</Text>
      <Text style={ui.body}>{eventDate(event.scheduled_at)}</Text><Text style={gs.muted}>{event.location || 'Local não informado'}</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/groups/[groupId]/event', params: { groupId, eventId: event.id, readOnly: '1' } })} style={gs.back}><Text style={gs.link}>Consultar partidas, gols e jogadores →</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/groups/[groupId]/confirmed', params: { groupId, eventId: event.id } })} style={gs.back}><Text style={gs.link}>Ver confirmados →</Text></Pressable>
    </View>)}
  </GroupScreen>;
}
