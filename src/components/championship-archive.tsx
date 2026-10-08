import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { ChampionshipDetail, formats, statuses } from '@/services/championships';
import { palette, ui } from './fut-ui';
import { Empty, gs } from './group-screen';
import { TrophyIcon } from './trophy-icon';
import { ChampionshipStages, ChampionshipStandings } from './championship-standings';

export const archiveSections = {
  registration: { title: 'Inscrições e início', description: 'Inscrever times e iniciar o campeonato' },
  games: { title: 'Jogos', description: 'Confrontos e etapas do campeonato' },
  results: { title: 'Resultados', description: 'Placares e vencedores de cada partida' },
  teams: { title: 'Times e elencos', description: 'Times inscritos e seus jogadores' },
  standings: { title: 'Classificação', description: 'Tabela de pontos e etapas do mata-mata' },
  rankings: { title: 'Artilharia e assistências', description: 'Desempenho dos jogadores' },
  trophies: { title: 'Troféus', description: 'Campeões e premiações individuais' },
  information: { title: 'Informações e regulamento', description: 'Temporada, formato e regras da disputa' },
};
export type ArchiveSection = keyof typeof archiveSections;
export function isArchiveSection(value: string | undefined): value is ArchiveSection {
  return value !== undefined && Object.hasOwn(archiveSections, value);
}

export function ChampionshipArchiveMenu({ data }: { data: ChampionshipDetail }) {
  const champion = data.entries.find(entry => entry.club_id === data.champion_id);
  const sections = (Object.keys(archiveSections) as ArchiveSection[]).filter(section =>
    (section !== 'registration' || data.status === 'registration'));
  return <>
    <View style={gs.card}>
      <Text style={gs.badge}>{statuses[data.status]} · {data.season}</Text>
      {champion && <View style={gs.row}><TrophyIcon category="championship_champion" /><View style={{ flex: 1 }}><Text style={ui.eyebrow}>CAMPEÃO</Text><Text style={gs.heading}>{champion.name}</Text></View></View>}
      <Text style={ui.body}>{formats[data.format]} · {data.entries.length}/{data.capacity} times · {data.matches.length} jogos</Text>
      <Text style={ui.eyebrow}>CÓDIGO DE CONVITE</Text>
      <Text selectable accessibilityLabel={`Código do campeonato: ${data.code}`} style={gs.heading}>{data.code}</Text>
      <Text style={gs.muted}>Copie e envie este código aos responsáveis pelos times. Eles podem usá-lo em Campeonatos → Entrar com código de convite.</Text>
    </View>
    <View style={{ gap: 12 }}>
      <Text style={gs.heading}>Menu do campeonato</Text>
      {sections.map(section => <Pressable key={section} accessibilityRole="button" accessibilityLabel={`Abrir ${archiveSections[section].title}`} onPress={() => router.push({ pathname: '/championships/history', params: { championshipId: data.id, section } })}
        style={({ pressed }) => [gs.card, gs.row, { paddingVertical: 16 }, pressed && { backgroundColor: '#E5EFE5' }]}>
        <View style={{ flex: 1, gap: 4 }}><Text style={gs.link}>{archiveSections[section].title}</Text><Text style={gs.muted}>{archiveSections[section].description}</Text></View>
        <Text style={{ color: palette.green, fontSize: 22 }} accessible={false}>›</Text>
      </Pressable>)}
    </View>
  </>;
}

export function ChampionshipArchiveContent({ data, section }: { data: ChampionshipDetail; section: ArchiveSection }) {
  const name = (id: string) => data.entries.find(entry => entry.club_id === id)?.name ?? 'Time';
  if (section === 'information') return <View style={gs.card}>
    <Text style={gs.heading}>{data.name}</Text><Text style={gs.badge}>{data.season} · {statuses[data.status]}</Text>
    <Text style={ui.body}>{formats[data.format]} · {data.entries.length}/{data.capacity} times</Text>
    {data.description && <Text style={ui.body}>{data.description}</Text>}
    {data.format === 'cascade' ? <Text style={ui.body}>4 times · final geral única. Ordem: semifinais dos vencedores → final dos vencedores → semifinal dos perdedores → final dos perdedores → final geral. Quem perde a final dos vencedores entra direto na final dos perdedores e descansa durante a semifinal dessa chave. Seeds: 1 × 4 e 2 × 3.</Text>
      : data.format === 'groups_knockout' ? <Text style={ui.body}>Grupos de quatro, turno único; os dois melhores avançam ao mata-mata. Vitória: 3 pontos, empate: 1. Desempate: saldo de gols, gols marcados e ordem de inscrição.</Text>
      : <Text style={ui.body}>Eliminação simples: o vencedor de cada partida avança até a final.</Text>}
    <Text style={gs.muted}>A ordem de inscrição define as seeds. Nos jogos eliminatórios, o vencedor do desempate avança quando o placar termina igual.</Text>
  </View>;
  if (section === 'teams') return <>{!data.entries.length && <Empty>Nenhum time inscrito.</Empty>}{data.entries.map(entry => <Pressable key={entry.id} accessibilityRole="button" accessibilityLabel={`Ver jogadores do ${entry.name}`} onPress={() => router.push({ pathname: '/championships/team', params: { championshipId: data.id, clubId: entry.club_id } })} style={({ pressed }) => [gs.card, gs.row, pressed && { opacity: 0.7 }]}>
    <View style={{ flex: 1, gap: 8 }}><Text style={gs.badge}>Seed {entry.seed} · {entry.players.length} jogadores</Text><Text style={gs.heading}>{entry.name}</Text><Text style={gs.link}>Ver jogadores</Text></View>
    <Text style={gs.link} accessible={false}>›</Text>
  </Pressable>)}</>;
  if (section === 'games' || section === 'results') {
    const matches = data.matches.filter(match => section === 'results' ? match.home_score !== null : match.home_score === null);
    return matches.length ? <ChampionshipStages data={data} matches={matches} /> : <Empty>Nenhuma partida registrada.</Empty>;
  }
  if (section === 'standings') return <ChampionshipStandings data={data} />;
  if (section === 'rankings') return <>
    {!data.statistics_complete && <Text style={ui.error}>Há partidas sem estatísticas completas. Os troféus individuais só são concedidos quando todos os placares têm os gols atribuídos.</Text>}
    {!data.player_rankings.length && <Empty>Nenhuma estatística registrada.</Empty>}
    {data.player_rankings.map(player => <View key={player.profile_id} style={gs.card}><Text style={gs.heading}>{player.name}</Text><Text style={gs.badge}>{name(player.club_id)}</Text><Text style={ui.body}>{player.goals} gols · {player.assists} assistências</Text></View>)}
  </>;
  return <>
    <Text style={ui.body}>Campeão e vice-campeão para os elencos inscritos. Artilheiro e líder de assistências para os maiores totais, incluindo empates. Premiação concedida ao terminar a final.</Text>
    {!data.trophies.length && <Empty>Nenhum troféu registrado.</Empty>}
    {data.trophies.map(trophy => <View key={trophy.id} style={[gs.card, gs.row]}><TrophyIcon category={trophy.category} /><View style={{ flex: 1, gap: 6 }}><Text style={gs.link}>{trophy.name}</Text><Text style={ui.body}>{trophy.title}</Text><Text style={gs.muted}>Marca: {trophy.value}</Text></View></View>)}
  </>;
}

