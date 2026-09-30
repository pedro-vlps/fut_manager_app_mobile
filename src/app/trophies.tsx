import { Text, View } from 'react-native';
import { Empty, GroupScreen, gs } from '@/components/group-screen';
import { TrophyIcon } from '@/components/trophy-icon';
import { useApiResource } from '@/hooks/use-api-resource';
import { TrophyCollection } from '@/services/trophies';

export default function TrophiesPage() {
  const resource = useApiResource<TrophyCollection>('/auth/me/trophies');
  return <GroupScreen title="Minha coleção" eyebrow="FUTMANAGER · TROFÉUS" subtitle={`${resource.data?.total ?? 0} troféus conquistados nas temporadas.`} {...resource}>
    {resource.data?.total === 0 && <Empty>Você ainda não conquistou troféus. Termine uma temporada em primeiro lugar de um ranking para ganhar o seu.</Empty>}
    {resource.data?.trophies.map(trophy => <View key={trophy.id} style={[gs.card, gs.row]}>
      <TrophyIcon category={trophy.category} />
      <View style={{ flex: 1, gap: 8 }}>
        <Text style={gs.badge}>1º LUGAR · TEMPORADA</Text>
        <Text style={[gs.heading, { fontSize: 17 }]}>{trophy.title}</Text>
        <Text style={gs.muted}>Conquistado em {new Date(trophy.awarded_at).toLocaleDateString('pt-BR')}</Text>
      </View>
    </View>)}
  </GroupScreen>;
}
