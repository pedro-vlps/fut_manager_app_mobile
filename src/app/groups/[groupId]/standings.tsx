import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Empty, GroupScreen, gs } from '@/components/group-screen';
import { palette } from '@/components/fut-ui';
import { useApiResource } from '@/hooks/use-api-resource';
import { Ranking } from '@/services/groups';

function sameStanding(a: Ranking, b: Ranking) {
  return a.points === b.points && a.wins === b.wins && a.draws === b.draws && a.losses === b.losses && a.goals === b.goals;
}

export default function GeneralStandings() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const resource = useApiResource<Ranking[]>(`/my-groups/${groupId}/standings`);
  const rows = resource.data ?? [];
  return <GroupScreen title="Classificação geral" subtitle="Com temporadas ativas, os pontos são da temporada atual e o primeiro colocado recebe o troféu de campeão no encerramento. Sem temporadas, os pontos são acumulados." {...resource}>
    <Text style={gs.muted}>Vitória: 3 pontos · empate: 1 ponto · derrota: 0. Desempates: mais vitórias, mais empates, menos derrotas e mais gols marcados. Empates em todos os critérios dividem a posição.</Text>
    {!rows.length ? <Empty>Ainda não há jogadores com partidas finalizadas.</Empty> : <ScrollView horizontal showsHorizontalScrollIndicator accessibilityLabel="Classificação dos jogadores. Deslize para ver todas as colunas.">
      <View style={s.table}>
        <View style={[s.row, s.header]}>
          <Text style={s.position}>#</Text><Text style={s.player}>Jogador</Text>
          {['PTS', 'J', 'V', 'E', 'D', 'G'].map(label => <Text key={label} style={s.number}>{label}</Text>)}
        </View>
        {rows.map(person => <View key={`${person.is_guest}-${person.id}`} style={s.row}>
          <Text style={s.position}>{rows.findIndex(row => sameStanding(row, person)) + 1}</Text>
          <View style={s.player}><Text style={s.name}>{person.name}</Text>{person.is_guest && <Text style={gs.muted}>Convidado</Text>}</View>
          {[person.points, person.matches, person.wins, person.draws, person.losses, person.goals].map((value, column) => <Text key={column} style={[s.number, column === 0 && s.points]}>{value}</Text>)}
        </View>)}
      </View>
    </ScrollView>}
    <Text style={gs.muted}>PTS: pontos · J: jogos · V: vitórias · E: empates · D: derrotas · G: gols marcados. Jogadores fora da escalação por troca temporária não recebem o resultado da partida. Eventos cancelados não contam.</Text>
  </GroupScreen>;
}

const s = StyleSheet.create({
  table: { minWidth: 500, backgroundColor: palette.paper, borderWidth: 1, borderColor: palette.border, borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 58, borderBottomWidth: 1, borderBottomColor: palette.border },
  header: { backgroundColor: '#F4F5F4', minHeight: 42 },
  position: { width: 36, textAlign: 'center', color: palette.muted },
  player: { width: 200, padding: 8, color: palette.ink },
  name: { color: palette.ink, fontWeight: '600' },
  number: { width: 44, textAlign: 'center', color: palette.ink, fontVariant: ['tabular-nums'] },
  points: { fontWeight: '800', color: palette.green },
});
