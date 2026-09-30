import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { ui } from '@/components/fut-ui';
import { Empty, GroupScreen, gs } from '@/components/group-screen';
import { useApiResource } from '@/hooks/use-api-resource';
import { Season, eventDate } from '@/services/groups';

export default function SeasonsHistory() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const resource = useApiResource<{ seasons: Season[] }>(`/my-groups/${groupId}/seasons`);
  return <GroupScreen title="Histórico de temporadas" subtitle="Os registros de cada temporada ficam preservados aqui, mesmo se o grupo desativar a opção." {...resource}>
    {resource.data?.seasons.length === 0 && <Empty>Nenhuma temporada encerrada. Temporadas são opcionais e podem ser ativadas nas configurações do grupo.</Empty>}
    {resource.data?.seasons.map(season => <Pressable key={season.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/groups/[groupId]/rankings', params: { groupId, seasonId: season.id } })} style={gs.card}>
      <Text style={gs.badge}>ENCERRADA</Text>
      <Text style={gs.heading}>Temporada {season.number}</Text>
      <Text style={ui.body}>De {eventDate(season.starts_at)}</Text>
      <Text style={ui.body}>Até {eventDate(season.ends_at)}</Text>
      <Text style={gs.link}>Ver registros dos jogadores →</Text>
    </Pressable>)}
  </GroupScreen>;
}
