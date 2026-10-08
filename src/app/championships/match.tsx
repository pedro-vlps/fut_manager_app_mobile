import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/fut-ui';
import { Empty, GroupScreen } from '@/components/group-screen';
import { ChampionshipMatchCard } from '@/components/championship-match';
import { useAuth } from '@/contexts/auth';
import { useApiResource } from '@/hooks/use-api-resource';
import { ChampionshipDetail } from '@/services/championships';

export default function ChampionshipMatchPage() {
  const { session } = useAuth();
  const params = useLocalSearchParams<{ championshipId?: string; matchId?: string }>();
  const championshipId = typeof params.championshipId === 'string' ? params.championshipId : '';
  const matchId = typeof params.matchId === 'string' ? params.matchId : '';
  const resource = useApiResource<ChampionshipDetail>(`/championships/${encodeURIComponent(championshipId)}`);
  const data = resource.data;
  const match = data?.matches.find(item => item.id === matchId);
  return <GroupScreen title={match ? `Jogo ${match.sequence}` : 'Partida'} subtitle={data?.name} eyebrow="FUTMANAGER · PARTIDA DO CAMPEONATO" {...resource}>
    {data && <>
      <Button onPress={() => router.dismissTo({ pathname: '/championships/history', params: { championshipId: data.id, section: 'games' } })}>Todos os jogos</Button>
      {match ? <ChampionshipMatchCard key={match.id} match={match} data={data} update={resource.update} canManage={data.owner_id === session?.profile.id && data.status === 'in_progress'} />
        : <Empty>Esta partida não foi encontrada neste campeonato.</Empty>}
    </>}
  </GroupScreen>;
}
