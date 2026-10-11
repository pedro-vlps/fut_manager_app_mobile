import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { Empty, GroupScreen, gs } from '@/components/group-screen';
import { useApiResource } from '@/hooks/use-api-resource';
import { ConfirmedPerson } from '@/services/groups';
import { Button, ui } from '@/components/fut-ui';
import { useMutation } from '@/hooks/use-mutation';

export default function Confirmed() {
  const { groupId, eventId } = useLocalSearchParams<{ groupId: string; eventId: string }>();
  const resource = useApiResource<ConfirmedPerson[]>(`/my-groups/${groupId}/events/${eventId}/confirmed`);
  const action = useMutation();
  return <GroupScreen title="Presenças confirmadas" subtitle={resource.data ? `${resource.data.length} pessoa(s) confirmada(s) para este evento.` : 'Quem já garantiu presença na pelada.'} {...resource}>
    {action.error && <Text accessibilityRole="alert" style={ui.error}>{action.error}</Text>}
    {resource.data?.length === 0 && <Empty>Ninguém confirmou presença ainda. Que tal chamar a turma?</Empty>}
    {resource.data?.map((person, index) => <View key={`${person.is_guest}-${person.id}`} style={gs.card}>
      <View style={gs.row}>
      <Text style={gs.badge}>{String(index + 1).padStart(2, '0')}</Text><Text style={[gs.heading, { flex: 1 }]}>{person.name}{person.is_guest ? ' · convidado' : ''}</Text><Text style={gs.badge}>{person.role === 'goalkeeper' ? 'Goleiro' : 'Linha'}</Text>
      </View>
      {person.can_cancel_confirmation && <Button loading={action.busy} disabled={resource.refreshing} onPress={() => { void action.mutate(`/my-groups/${groupId}/events/${eventId}/cancel-confirmation`, undefined, async () => { await resource.refresh(); }); }}>Remover minha confirmação</Button>}
    </View>)}
  </GroupScreen>;
}
