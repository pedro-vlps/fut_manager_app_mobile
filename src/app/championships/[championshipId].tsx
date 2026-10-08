import { useLocalSearchParams } from 'expo-router';
import { GroupScreen } from '@/components/group-screen';
import { ChampionshipArchiveMenu } from '@/components/championship-archive';
import { useApiResource } from '@/hooks/use-api-resource';
import { ChampionshipDetail } from '@/services/championships';

export default function ChampionshipScreen() {
  const { championshipId } = useLocalSearchParams<{ championshipId: string }>();
  const resource = useApiResource<ChampionshipDetail>(`/championships/${championshipId}`);
  return <GroupScreen title={resource.data?.name ?? 'Campeonato'} eyebrow="FUTMANAGER · CAMPEONATO" {...resource}>
    {resource.data && <ChampionshipArchiveMenu data={resource.data} />}
  </GroupScreen>;
}
