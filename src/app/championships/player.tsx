import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, palette, ui } from '@/components/fut-ui';
import { GroupScreen, gs } from '@/components/group-screen';
import { Catalog, Positions } from '@/components/position-selector';
import { TrophyIcon } from '@/components/trophy-icon';
import { TrophyCollection } from '@/services/trophies';
import { useApiResource } from '@/hooks/use-api-resource';


type MemberProfile = { id: string; name: string; positions: Positions; trophies: TrophyCollection; can_rate: boolean };

export default function ChampionshipPlayerPage() {
  const { championshipId, clubId, profileId } = useLocalSearchParams<{ championshipId: string; clubId: string; profileId: string }>();
  return <ChampionshipPlayerContent key={`${championshipId}:${clubId}:${profileId}`} championshipId={championshipId} clubId={clubId} profileId={profileId} />;
}

function ChampionshipPlayerContent({ championshipId, clubId, profileId }: { championshipId: string; clubId: string; profileId: string }) {
  const resource = useApiResource<MemberProfile>(`/championships/${encodeURIComponent(championshipId)}/clubs/${encodeURIComponent(clubId)}/players/${encodeURIComponent(profileId)}`);
  const catalog = useApiResource<Catalog>('/auth/modalities');
  const [expanded, setExpanded] = useState(false);
  const profile = resource.data;
  return <GroupScreen title={profile?.name ?? 'Perfil do jogador'} eyebrow="FUTMANAGER · JOGADOR"
    loading={resource.loading || catalog.loading} error={resource.error || catalog.error}
    refreshing={resource.refreshing || catalog.refreshing} refresh={() => { void resource.refresh(); void catalog.refresh(); }}>
    {profile && <>
      <View style={gs.card}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: palette.lime, alignItems: 'center', justifyContent: 'center' }}><Text style={ui.title}>{profile.name.trim().charAt(0).toUpperCase()}</Text></View>
        <Text style={gs.heading}>{profile.name}</Text>
      </View>

      <View style={gs.card}>
        <Text style={gs.heading}>Troféus · {profile.trophies.total}</Text>
        {profile.trophies.total === 0 ? <Text style={ui.body}>Este jogador ainda não conquistou troféus.</Text> : <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>{profile.trophies.summary.map(item => <View key={item.category} style={{ alignItems: 'center' }}><TrophyIcon category={item.category} /><Text style={gs.badge}>×{item.count}</Text></View>)}</View>
          <Button onPress={() => setExpanded(!expanded)}>{expanded ? 'Recolher troféus' : 'Ver todos os troféus'}</Button>
          {expanded && profile.trophies.trophies.map(trophy => <View key={trophy.id} style={gs.row}><TrophyIcon category={trophy.category} /><Text style={[ui.body, { flex: 1 }]}>{trophy.title}</Text></View>)}
        </>}
      </View>
      <Text style={gs.heading}>Modalidades e posições</Text>
      {Object.entries(profile.positions).filter(([, positions]) => positions.length).map(([sport, positions]) => <View key={sport} style={gs.card}>
        <Text style={gs.heading}>{catalog.data?.[sport]?.label ?? sport}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{positions.map(position => <Text key={position} style={gs.badge}>{catalog.data?.[sport]?.positions[position] ?? position}</Text>)}</View>
      </View>)}
      {!Object.values(profile.positions).some(p => p.length) && <Text style={ui.body}>Este jogador ainda não informou suas posições.</Text>}
    </>}
  </GroupScreen>;
}
