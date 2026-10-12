import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Button, ui } from '@/components/fut-ui';
import { GroupScreen, gs } from '@/components/group-screen';
import { archiveSections, ChampionshipArchiveContent, isArchiveSection } from '@/components/championship-archive';
import { useApiResource } from '@/hooks/use-api-resource';
import { ChampionshipDetail, matchLabel } from '@/services/championships';
import { ChampionshipRegistration } from '@/components/championship-registration';
import { LeagueRounds } from '@/components/league-rounds';
import { ChampionshipGroups } from '@/components/championship-groups';

export default function ChampionshipHistory() {
  const params = useLocalSearchParams<{ championshipId?: string; section?: string }>();
  const championshipId = typeof params.championshipId === 'string' ? params.championshipId : '';
  const section = typeof params.section === 'string' ? params.section : undefined;
  const resource = useApiResource<ChampionshipDetail>(`/championships/${encodeURIComponent(championshipId)}`);
  const data = resource.data;
  const pendingMatches = data?.matches.filter(match => match.home_score === null) ?? [];
  const valid = isArchiveSection(section);
  return <GroupScreen title={valid ? archiveSections[section].title : 'Campeonato'} subtitle={resource.data?.name} eyebrow="FUTMANAGER · CAMPEONATO" {...resource}>
    {data && <>
      <Button onPress={() => router.dismissTo({ pathname: '/championships/[championshipId]', params: { championshipId: data.id } })}>Menu do campeonato</Button>
      {!valid ? <Text style={ui.error}>Seção não encontrada. Volte ao menu e escolha uma opção.</Text>
        : section === 'registration' ? <ChampionshipRegistration data={data} update={resource.update} />
        : section === 'groups' && data.format === 'groups_knockout' ? <ChampionshipGroups key={data.id} data={data} update={resource.update} />
        : section === 'games' && data.format === 'league' ? <>
          <Text style={gs.muted}>Cada time joga uma vez por rodada. Você pode abrir e registrar qualquer jogo pendente, de qualquer rodada.</Text>
          <LeagueRounds key={data.id} data={data} />
        </>
        : section === 'games' ? <>
          {!pendingMatches.length && <Text style={ui.body}>{data.status === 'registration' ? 'Os jogos aparecem após o início do campeonato.' : 'Nenhum jogo pendente. Consulte as partidas concluídas em Resultados.'}</Text>}
          {pendingMatches.map(match => {
            const home = data.entries.find(e => e.club_id === match.home_id)?.name ?? 'Time';
            const away = data.entries.find(e => e.club_id === match.away_id)?.name ?? 'Time';
            const waiting = data.format === 'cascade' && data.matches.some(m => m.sequence < match.sequence && m.home_score === null);
            return <Pressable key={match.id} accessibilityRole="button" accessibilityLabel={`Abrir jogo ${match.sequence}: ${home} contra ${away}`} onPress={() => router.push({ pathname: '/championships/match', params: { championshipId: data.id, matchId: match.id } })} style={({ pressed }) => [gs.card, gs.row, pressed && { opacity: 0.7 }]}>
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={gs.badge}>Jogo {match.sequence} · {matchLabel(match, data)}</Text>
                <Text style={gs.heading}>{home} × {away}</Text>
                <Text style={gs.muted}>{waiting ? 'Aguardando o jogo anterior' : 'Resultado pendente'}</Text>
                <Text style={gs.link}>Abrir jogo</Text>
              </View>
              <Text style={gs.link} accessible={false}>›</Text>
            </Pressable>;
          })}
        </>
        : <ChampionshipArchiveContent data={data} section={section} />}
    </>}
  </GroupScreen>;
}

