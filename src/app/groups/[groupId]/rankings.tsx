import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { ui } from '@/components/fut-ui';
import { RankingTabs } from '@/components/ranking-tabs';
import { GroupScreen, gs } from '@/components/group-screen';
import { useApiResource } from '@/hooks/use-api-resource';
import { Ranking, SeasonRankings, eventDate } from '@/services/groups';

export default function Rankings() {
  const { groupId, seasonId, eventId } = useLocalSearchParams<{ groupId: string; seasonId?: string; eventId?: string }>();
  return eventId ? <EventRankings key={`${groupId}:${eventId}`} groupId={groupId} eventId={eventId} /> : <GroupRankings groupId={groupId} seasonId={seasonId} />;
}

function EventRankings({ groupId, eventId }: { groupId: string; eventId: string }) {
  const resource = useApiResource<Ranking[]>(`/my-groups/${groupId}/events/${eventId}/rankings`);
  return <GroupScreen title="Ranking do evento" subtitle="Estatísticas somente das partidas finalizadas deste evento." {...resource}>
    <Text style={gs.muted}>Empates dividem a mesma posição. Jogadores que ficaram fora por uma troca temporária não recebem o resultado da partida.</Text>
    <RankingTabs people={resource.data ?? []} />
  </GroupScreen>;
}

function GroupRankings({ groupId, seasonId }: { groupId: string; seasonId?: string }) {
  const resource = useApiResource<SeasonRankings>(seasonId ? `/my-groups/${groupId}/seasons/${seasonId}/rankings` : `/my-groups/${groupId}/season-rankings`);
  const season = resource.data?.season;
  return <GroupScreen title={season ? `Temporada ${season.number}` : 'Rankings do grupo'} subtitle={seasonId ? 'Registros preservados desta temporada encerrada.' : season ? 'Ranking da temporada atual. Partidas contam no período em que terminam.' : 'Ranking acumulado geral. Temporadas estão desativadas.'} {...resource}>
    {season && <View style={gs.card}><Text style={gs.badge}>{seasonId ? 'TEMPORADA ENCERRADA' : 'TEMPORADA ATUAL'}</Text><Text style={ui.body}>De {eventDate(season.starts_at)}</Text><Text style={ui.body}>Até {eventDate(season.ends_at)}</Text></View>}
    <Text style={gs.muted}>Estatísticas das partidas finalizadas. Empates dividem a mesma posição.</Text>
    <RankingTabs key={`${groupId}-${season?.id ?? 'all'}`} people={resource.data?.rankings ?? []} />
  </GroupScreen>;
}
