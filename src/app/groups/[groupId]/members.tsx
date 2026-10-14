import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Empty, GroupScreen, gs } from '@/components/group-screen';
import { Button, ui } from '@/components/fut-ui';
import { useApiResource } from '@/hooks/use-api-resource';
import { useMutation } from '@/hooks/use-mutation';
import { useAuth } from '@/contexts/auth';
import { Person, roleNames } from '@/services/groups';

export default function Members() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const resource = useApiResource<Person[]>(`/my-groups/${groupId}/members`);
  const { session } = useAuth();
  const action = useMutation();
  const [message, setMessage] = useState('');
  const isOwner = resource.data?.some(person => person.id === session?.profile.id && person.role === 'owner');
  async function changeRole(person: Person) {
    setMessage('');
    const role = person.role === 'admin' ? 'member' : 'admin';
    await action.mutate<Person[]>(`/my-groups/${groupId}/members/${person.id}/role`, { role }, people => {
      resource.update(people);
      setMessage(`${person.name} agora é ${role === 'admin' ? 'administrador' : 'jogador'} da pelada.`);
    });
  }
  return <GroupScreen title="Membros do grupo" subtitle="Organizadores e jogadores que fazem parte da turma." {...resource}>
    {resource.data?.length === 0 && <Empty>Nenhum membro encontrado.</Empty>}
    {isOwner && <Text style={ui.body}>Administradores podem gerenciar eventos, times, partidas e pedidos de entrada. Somente você, dono da pelada, pode definir os cargos.</Text>}
    {action.error && <Text accessibilityRole="alert" style={ui.error}>{action.error}</Text>}
    {message && <Text accessibilityRole="alert" style={gs.success}>{message}</Text>}
    {resource.data?.map(person => <View key={person.id} style={gs.card}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Ver perfil de ${person.name}`} onPress={() => router.push({ pathname: '/groups/[groupId]/member', params: { groupId, profileId: person.id } })} style={gs.row}>
        <Text style={[gs.heading, { flex: 1 }]}>{person.name}</Text><Text style={gs.badge}>{roleNames[person.role ?? 'member']}</Text><Text style={gs.link}>→</Text>
      </Pressable>
      {isOwner && person.role !== 'owner' && <Button loading={action.busy} disabled={resource.refreshing} onPress={() => void changeRole(person)}>
        {person.role === 'admin' ? 'Remover cargo de administrador' : 'Tornar administrador'}
      </Button>}
    </View>)}
  </GroupScreen>;
}
