import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { ChampionshipDetail, formats, statuses } from '@/services/championships';
import { useAuth } from '@/contexts/auth';
import { useMutation } from '@/hooks/use-mutation';
import { Button, palette, ui } from './fut-ui';
import { Empty, gs } from './group-screen';
import { TrophyIcon } from './trophy-icon';
import { ChampionshipStages, ChampionshipStandings } from './championship-standings';
import { LeagueRounds } from './league-rounds';
import { RankingTabs } from './ranking-tabs';
import { ResponsiveGrid } from './responsive-grid';

export const archiveSections = {
  punishments: { title: 'Punições', description: 'Desclassificação e perda de pontos' },
  groups: { title: 'Grupos', description: 'Ver e ajustar a divisão dos times nos grupos' },
  registration: { title: 'Inscrições e início', description: 'Inscrever times e iniciar o campeonato' },
  games: { title: 'Jogos', description: 'Confrontos e etapas do campeonato' },
  results: { title: 'Resultados', description: 'Placares e vencedores de cada partida' },
  teams: { title: 'Times e elencos', description: 'Times inscritos e seus jogadores' },
  general_standings: { title: 'Classificação geral', description: 'Pontos e desempenho dos times em todo o campeonato' },
  standings: { title: 'Classificação', description: 'Tabela de pontos por fase e etapas do campeonato' },
  rankings: { title: 'Rankings', description: 'Gols, assistências, gols contra, cartões e gols sofridos' },
  trophies: { title: 'Troféus', description: 'Campeões e premiações individuais' },
  information: { title: 'Informações e regulamento', description: 'Temporada, formato e regras da disputa' },
};
export type ArchiveSection = keyof typeof archiveSections;
export function isArchiveSection(value: string | undefined): value is ArchiveSection {
  return value !== undefined && Object.hasOwn(archiveSections, value);
}

export function ChampionshipArchiveMenu({ data }: { data: ChampionshipDetail }) {
  const { session } = useAuth();
  const action = useMutation();
  const canManage = data.owner_id === session?.profile.id;
  const champion = data.entries.find(entry => entry.club_id === data.champion_id);
  const sections = (Object.keys(archiveSections) as ArchiveSection[]).filter(section =>
    (section !== 'punishments' || canManage) && (section !== 'registration' || data.status === 'registration') && (section !== 'groups' || data.format === 'groups_knockout'));
  return <>
    <View style={gs.card}>
      <Text style={gs.badge}>{statuses[data.status]} · {data.season}</Text>
      {champion && <View style={gs.row}><TrophyIcon category="championship_champion" /><View style={{ flex: 1 }}><Text style={ui.eyebrow}>CAMPEÃO</Text><Text style={gs.heading}>{champion.name}</Text></View></View>}
      <Text style={ui.body}>{formats[data.format]} · {data.format === 'league' ? `${data.entries.length} times` : `${data.entries.length}/${data.capacity} times`} · {data.matches.length} jogos</Text>
      {canManage && data.code && <>
      <Text style={ui.eyebrow}>CÓDIGO DE CONVITE</Text>
      <Text selectable accessibilityLabel={`Código do campeonato: ${data.code}`} style={gs.heading}>{data.code}</Text>
      <Text style={gs.muted}>Copie e envie este código aos responsáveis pelos times. Eles podem usá-lo em Campeonatos → Entrar com código de convite.</Text>
      <Button loading={action.busy} onPress={() => void action.mutate(`/championships/${data.id}/code/rotate`, {}, () => router.replace({ pathname: "/championships/[championshipId]", params: { championshipId: data.id } }))}>Gerar novo código</Button>
      {action.error && <Text style={ui.error}>{action.error}</Text>}
      </>}
    </View>
    <View style={{ gap: 12 }}>
      <Text style={gs.heading}>Menu do campeonato</Text>
      <ResponsiveGrid>{sections.map(section => <Pressable key={section} accessibilityRole="button" accessibilityLabel={`Abrir ${archiveSections[section].title}`} onPress={() => router.push({ pathname: '/championships/history', params: { championshipId: data.id, section } })}
        style={({ pressed }) => [gs.card, gs.row, { paddingVertical: 16 }, pressed && { backgroundColor: '#E5EFE5' }]}>
        <View style={{ flex: 1, gap: 4 }}><Text style={gs.link}>{archiveSections[section].title}</Text><Text style={gs.muted}>{archiveSections[section].description}</Text></View>
        <Text style={{ color: palette.green, fontSize: 22 }} accessible={false}>›</Text>
      </Pressable>)}</ResponsiveGrid>
    </View>
  </>;
}

export function ChampionshipArchiveContent({ data, section }: { data: ChampionshipDetail; section: ArchiveSection }) {
  const name = (id: string) => data.entries.find(entry => entry.club_id === id)?.name ?? 'Time';
  if (section === 'information') return <View style={gs.card}>
    <Text style={gs.heading}>{data.name}</Text><Text style={gs.badge}>{data.season} · {statuses[data.status]}</Text>
    <Text style={ui.body}>{formats[data.format]} · {data.format === 'league' ? `${data.entries.length} times` : `${data.entries.length}/${data.capacity} times`}</Text>
    {data.description && <Text style={ui.body}>{data.description}</Text>}
    {data.format === 'cascade' ? <Text style={ui.body}>4 times · final geral única. Ordem: semifinais dos vencedores → final dos vencedores → semifinal dos perdedores → final dos perdedores → final geral. Quem perde a final dos vencedores entra direto na final dos perdedores e descansa durante a semifinal dessa chave. Seeds: 1 × 4 e 2 × 3.</Text>
      : data.format === 'league' ? <Text style={ui.body}>Todos contra todos {data.home_and_away ? 'em ida e volta, com mandos invertidos' : 'em jogo único'}, sem final ou mata-mata. {(data.capacity % 2 ? data.capacity : data.capacity - 1) * (data.home_and_away ? 2 : 1)} rodadas. O primeiro colocado ao fim de todos os jogos é campeão, e o segundo é vice.</Text>
      : data.format === 'groups_knockout' ? <Text style={ui.body}>{data.capacity === 12 ? '4 grupos de 3, turno único; apenas o líder de cada grupo avança. Semifinais: A × B e C × D. Os vencedores disputam a final.' : 'Grupos de quatro, turno único; os dois melhores avançam ao mata-mata.'} Vitória: 3 pontos, empate: 1. Desempate: mais vitórias, mais empates, menos derrotas, mais gols marcados e ordem de inscrição.</Text>
      : <Text style={ui.body}>Eliminação simples: o vencedor de cada partida avança até a final.</Text>}
    <Text style={gs.muted}>Classificação geral: vitória vale 3 pontos e empate vale 1. Desempates: mais vitórias, mais empates, menos derrotas e mais gols marcados; persistindo o empate, ordem de inscrição. Resultados empatados contam como empate na tabela geral, inclusive em jogos eliminatórios.</Text>
    <Text style={gs.muted}>A ordem de inscrição define as seeds. Nos jogos eliminatórios, o vencedor do desempate avança quando o placar termina igual.</Text>
  </View>;
  if (section === 'teams') return <>{!data.entries.length && <Empty>Nenhum time inscrito.</Empty>}{data.entries.map(entry => <Pressable key={entry.id} accessibilityRole="button" accessibilityLabel={`Ver jogadores do ${entry.name}`} onPress={() => router.push({ pathname: '/championships/team', params: { championshipId: data.id, clubId: entry.club_id } })} style={({ pressed }) => [gs.card, gs.row, pressed && { opacity: 0.7 }]}>
    <View style={{ flex: 1, gap: 8 }}><Text style={gs.badge}>Seed {entry.seed} · {entry.players.length} jogadores</Text><Text style={gs.heading}>{entry.name}</Text><Text style={gs.link}>Ver jogadores</Text></View>
    <Text style={gs.link} accessible={false}>›</Text>
  </Pressable>)}</>;
  if (section === 'games' || section === 'results') {
    if (data.format === 'league') return <LeagueRounds key={`${data.id}-${section}`} data={data} mode={section} />;
    const matches = data.matches.filter(match => section === 'results' ? match.home_score !== null : match.home_score === null);
    return matches.length ? <ChampionshipStages data={data} matches={matches} /> : <Empty>Nenhuma partida registrada.</Empty>;
  }
  if (section === 'general_standings') return <ChampionshipStandings data={data} general />;
  if (section === 'standings') return <ChampionshipStandings data={data} />;
  if (section === 'rankings') return <>
    {!data.statistics_complete && <Text style={ui.error}>Há partidas sem estatísticas completas. Os troféus individuais só são concedidos quando todas as partidas têm súmula completa ou WO.</Text>}
    <Text style={gs.muted}>Somente partidas finalizadas. Empates são decididos pela classificação do time. O elenco inscrito recebe o resultado do time; gols sofridos contam apenas para o goleiro indicado em cada partida.</Text>
    <RankingTabs key={data.id} hideWins hideLosses people={data.player_rankings.map(player => ({ ...player, id: player.profile_id, role: null, is_guest: false, wins: 0, draws: 0, points: 0, team_position: player.team_position, team_name: name(player.club_id) }))} />
  </>;
  return <>
    <Text style={ui.body}>Campeão e vice aparecem pelo time. Há um único artilheiro, líder de assistências e melhor goleiro; empates são decididos pela classificação do time. Premiação concedida ao encerrar o campeonato.</Text>
    {!data.trophies.length && <Empty>Nenhum troféu registrado.</Empty>}
    {data.trophies.map(trophy => <View key={trophy.id} style={[gs.card, gs.row]}><TrophyIcon category={trophy.category} /><View style={{ flex: 1, gap: 6 }}><Text style={gs.link}>{trophy.name}</Text><Text style={ui.body}>{trophy.title}</Text><Text style={gs.muted}>Marca: {trophy.value}</Text></View></View>)}
  </>;
}

