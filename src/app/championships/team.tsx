import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Button, ui } from '@/components/fut-ui';
import { Empty, GroupScreen, gs } from '@/components/group-screen';
import { useApiResource } from '@/hooks/use-api-resource';
import { ChampionshipDetail } from '@/services/championships';

export default function ChampionshipTeam() {
  const { championshipId, clubId } = useLocalSearchParams<{ championshipId: string; clubId: string }>();
  const resource = useApiResource<ChampionshipDetail>(`/championships/${encodeURIComponent(championshipId ?? '')}`);
  const data = resource.data;
  const team = data?.entries.find(entry => entry.club_id === clubId);
  return <GroupScreen title={team?.name ?? 'Elenco do time'} subtitle={data?.name} eyebrow="FUTMANAGER · ELENCO INSCRITO" {...resource}>
    <Button onPress={() => router.dismissTo({ pathname: '/championships/history', params: { championshipId, section: 'teams' } })}>Todos os times</Button>
    {!team ? <Empty>Este time não está inscrito neste campeonato.</Empty> : <>
      <Text style={ui.body}>{team.players.length} jogadores inscritos nesta edição. Toque em um jogador para ver seu perfil.</Text>
      {!team.players.length && <Empty>Nenhum jogador inscrito.</Empty>}
      {team.players.map(player => <Pressable key={player.id} accessibilityRole="button" accessibilityLabel={`Ver perfil de ${player.name}`} onPress={() => router.push({ pathname: '/championships/player', params: { championshipId, clubId, profileId: player.id } })} style={({ pressed }) => [gs.card, gs.row, pressed && { opacity: 0.7 }]}>
        <View style={{ flex: 1, gap: 8 }}><Text style={gs.heading}>{player.name}</Text><Text style={gs.link}>Ver perfil</Text></View><Text style={gs.link} accessible={false}>›</Text>
      </Pressable>)}
    </>}
  </GroupScreen>;
}
