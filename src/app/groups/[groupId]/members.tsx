import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { Empty, GroupScreen, gs } from '@/components/group-screen';
import { useApiResource } from '@/hooks/use-api-resource';
import { Person, roleNames } from '@/services/groups';

export default function Members() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const resource = useApiResource<Person[]>(`/my-groups/${groupId}/members`);
  return <GroupScreen title="Membros do grupo" subtitle="Organizadores e jogadores que fazem parte da turma." {...resource}>
    {resource.data?.length === 0 && <Empty>Nenhum membro encontrado.</Empty>}
    {resource.data?.map(person => <View key={person.id} style={[gs.card, gs.row]}><Text style={[gs.heading, { flex: 1 }]}>{person.name}</Text><Text style={gs.badge}>{roleNames[person.role ?? 'member']}</Text></View>)}
  </GroupScreen>;
}
