import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { Empty, GroupScreen, gs } from '@/components/group-screen';
import { useApiResource } from '@/hooks/use-api-resource';
import { Person } from '@/services/groups';

export default function Confirmed() {
  const { groupId, eventId } = useLocalSearchParams<{ groupId: string; eventId: string }>();
  const resource = useApiResource<Person[]>(`/my-groups/${groupId}/events/${eventId}/confirmed`);
  return <GroupScreen title="Presenças confirmadas" subtitle={resource.data ? `${resource.data.length} pessoa(s) confirmada(s) para este evento.` : 'Quem já garantiu presença na pelada.'} {...resource}>
    {resource.data?.length === 0 && <Empty>Ninguém confirmou presença ainda. Que tal chamar a turma?</Empty>}
    {resource.data?.map((person, index) => <View key={`${person.is_guest}-${person.id}`} style={[gs.card, gs.row]}>
      <Text style={gs.badge}>{String(index + 1).padStart(2, '0')}</Text><Text style={[gs.heading, { flex: 1 }]}>{person.name}</Text><Text style={gs.badge}>{person.is_guest ? 'Convidado' : 'Confirmado'}</Text>
    </View>)}
  </GroupScreen>;
}
