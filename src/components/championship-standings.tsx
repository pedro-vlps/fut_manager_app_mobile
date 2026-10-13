import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChampionshipDetail, ChampionshipMatch, matchLabel } from '@/services/championships';
import { Empty, gs } from './group-screen';
import { palette } from './fut-ui';

export function ChampionshipStandings({ data, general = false }: { data: ChampionshipDetail; general?: boolean }) {
  const table = general ? data.general_standings : data.standings;
  const pools = [...new Set(table.map(row => row.pool))];
  return <>
    {!pools.length && (data.format === 'groups_knockout' || data.format === 'league' || general) && <Empty>A classificação aparece após o início do campeonato.</Empty>}
    {pools.map(pool => <View key={pool} style={s.panel}>
      <Text style={s.title}>{general || data.format === 'league' ? 'Classificação geral' : `Grupo ${pool}`}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator accessibilityLabel={`${general || data.format === 'league' ? 'Tabela geral' : `Tabela do grupo ${pool}`}. Deslize para ver todas as estatísticas.`}>
        <View style={{ minWidth: 530 }}>
          <View style={[s.row, s.header]}>
            <Text style={s.position}>#</Text><Text style={[s.team, s.label]}>Time</Text>
            {['PTS', 'J', 'V', 'E', 'D', 'GP', 'GC', 'SG'].map(label => <Text key={label} style={[s.number, s.label, label === 'PTS' && s.points]}>{label}</Text>)}
          </View>
          {table.filter(row => row.pool === pool).map((row, index) => {
            const name = data.entries.find(e => e.club_id === row.club_id)?.name ?? 'Time';
            const { wins, draws, losses } = row;
            const balance = row.goals_for - row.goals_against;
            const values = [row.points, row.played, wins, draws, losses, row.goals_for, row.goals_against, balance > 0 ? `+${balance}` : balance];
            return <Pressable key={row.club_id} accessibilityRole="button" accessibilityLabel={`${index + 1}º, ${name}, ${row.points} pontos, ${row.played} jogos, ${wins} vitórias, ${draws} empates, ${losses} derrotas, saldo ${balance}. Ver time.`} onPress={() => router.push({ pathname: '/championships/team', params: { championshipId: data.id, clubId: row.club_id } })} style={({ pressed }) => [s.row, !general && data.format === 'groups_knockout' && !row.disqualified && index < (data.capacity === 12 ? 1 : 2) && s.qualifying, pressed && { opacity: 0.65 }]}>
              <Text style={s.position}>{index + 1}</Text>
              <Text style={s.team} numberOfLines={1}>{name}{row.disqualified ? ' · DQ' : data.entries.find(entry => entry.club_id === row.club_id)?.points_deducted ? ' · penalizado' : ''}</Text>
              {values.map((value, column) => <Text key={column} style={[s.number, column === 0 && s.points]}>{value}</Text>)}
            </Pressable>;
          })}
        </View>
      </ScrollView>
      {!general && data.format === 'groups_knockout' && <View style={s.legend}><View style={s.marker} /><Text style={gs.muted}>{data.capacity === 12 ? '1º lugar: vaga na semifinal' : '1º e 2º lugares: vagas no mata-mata'}</Text></View>}
    </View>)}
    {pools.length > 0 && <Text style={gs.muted}>DQ: desclassificado · PTS: pontos após punições · J: jogos · V: vitórias · E: empates · D: derrotas · GP: gols pró · GC: gols contra · SG: saldo de gols. Deslize a tabela para ver todas as colunas.</Text>}
    <Text style={gs.muted}>Vitória: 3 pontos · empate: 1 ponto. Desempates: mais vitórias, mais empates, menos derrotas, mais gols marcados e ordem de inscrição.</Text>
    {!general && <ChampionshipStages data={data} matches={data.matches.filter(m => m.stage !== 'groups')} />}
  </>;
}

export function ChampionshipStages({ data, matches }: { data: ChampionshipDetail; matches: ChampionshipMatch[] }) {
  const stages = new Map<string, ChampionshipMatch[]>();
  for (const match of [...matches].sort((a, b) => a.sequence - b.sequence)) {
    const title = matchLabel(match, data);
    stages.set(title, [...(stages.get(title) ?? []), match]);
  }
  return <>
    {!matches.length && data.format !== 'groups_knockout' && <Empty>As etapas aparecem após o início do campeonato.</Empty>}
    {[...stages].map(([title, games]) => <View key={title} style={{ gap: 12 }}>
      <Text style={gs.heading}>{data.format === 'league' ? `Rodada ${games[0].round}` : title}</Text>
      {data.format === 'league' && <Text style={gs.muted}>{games.length} jogos · {games.filter(game => game.home_score !== null).length} concluídos · {games.filter(game => game.home_score === null).length} pendentes</Text>}
      {games.map(match => <Pressable key={match.id} accessibilityRole="button" accessibilityLabel={`Abrir jogo ${match.sequence} de ${title}`} onPress={() => router.push({ pathname: '/championships/match', params: { championshipId: data.id, matchId: match.id } })} style={({ pressed }) => [s.panel, { padding: 16, gap: 12 }, pressed && { opacity: 0.7 }]}>
        <Text style={gs.muted}>Jogo {match.sequence} · {match.home_score === null ? 'A disputar' : match.walkover ? 'Finalizado por WO' : 'Finalizado'}</Text>
        {[match.home_id, match.away_id].map((id, i) => <View key={id} style={gs.row}>
          <Text style={[s.club, match.winner_id === id && s.winner]}>{data.entries.find(e => e.club_id === id)?.name ?? 'Time'}</Text>
          <Text style={[s.score, match.winner_id === id && s.winner]}>{(i === 0 ? match.home_score : match.away_score) ?? '–'}</Text>
        </View>)}
        {match.winner_id && match.home_score === match.away_score && <Text style={gs.badge}>Venceu no desempate: {data.entries.find(e => e.club_id === match.winner_id)?.name}</Text>}
        {match.home_score === null && <Text style={gs.link}>Abrir jogo</Text>}
      </Pressable>)}
    </View>)}
  </>;
}

const s = StyleSheet.create({
  panel: { backgroundColor: palette.paper, borderWidth: 1, borderColor: palette.border, borderRadius: 12, overflow: 'hidden' },
  title: { padding: 16, fontSize: 18, fontWeight: '800', color: palette.ink },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 56, borderTopWidth: 1, borderTopColor: palette.border, borderLeftWidth: 3, borderLeftColor: 'transparent', paddingRight: 8 },
  header: { backgroundColor: '#F4F5F4', minHeight: 42 },
  qualifying: { borderLeftColor: palette.green, backgroundColor: '#F5FAF6' },
  position: { width: 36, textAlign: 'center', color: palette.muted, fontSize: 13, fontVariant: ['tabular-nums'] },
  team: { width: 160, paddingRight: 12, color: palette.ink, fontSize: 14, fontWeight: '600' },
  number: { width: 40, textAlign: 'center', color: palette.ink, fontSize: 14, fontVariant: ['tabular-nums'] },
  points: { fontWeight: '800', color: palette.ink },
  label: { fontSize: 12, color: palette.muted },
  legend: { padding: 14, gap: 8, flexDirection: 'row', alignItems: 'center' },
  marker: { height: 12, width: 4, backgroundColor: palette.green },
  club: { flex: 1, color: palette.ink, fontSize: 15 },
  score: { minWidth: 30, textAlign: 'center', fontSize: 20, color: palette.muted, fontVariant: ['tabular-nums'] },
  winner: { color: palette.green, fontWeight: '800' },
});
