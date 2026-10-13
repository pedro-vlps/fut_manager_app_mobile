import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ChampionshipDetail } from '@/services/championships';
import { ChampionshipStages } from './championship-standings';
import { Empty, gs } from './group-screen';
import { palette } from './fut-ui';

export function LeagueRounds({ data, mode = 'games' }: { data: ChampionshipDetail; mode?: 'games' | 'results' }) {
  const rounds = [...new Set(data.matches.filter(match => match.stage === 'league').map(match => match.round))].sort((a, b) => a - b);
  const [selected, setSelected] = useState(0);
  const [width, setWidth] = useState(0);
  const tabs = useRef<ScrollView>(null);
  const pages = useRef<ScrollView>(null);
  const selectedRef = useRef(0);
  const viewport = useRef(0);
  const tabLayouts = useRef<Record<number, { x: number; width: number }>>({});

  function revealTab(index: number) {
    const tab = tabLayouts.current[index];
    if (tab) tabs.current?.scrollTo({ x: Math.max(0, tab.x - (viewport.current - tab.width) / 2), animated: true });
  }

  function select(index: number) {
    const next = Math.max(0, Math.min(rounds.length - 1, index));
    selectedRef.current = next;
    setSelected(next);
    revealTab(next);
  }

  useEffect(() => {
    pages.current?.scrollTo({ x: selectedRef.current * width, animated: false });
  }, [width]);

  if (!rounds.length) return <Empty>As rodadas aparecem após o início da liga.</Empty>;

  return <View style={{ gap: 20 }}>
    {data.home_and_away && <Text style={gs.badge}>{rounds[selected] <= (data.capacity % 2 ? data.capacity : data.capacity - 1) ? 'TURNO DE IDA' : 'TURNO DE VOLTA'}</Text>}
    <Text style={gs.muted}>Toque em uma rodada ou deslize os jogos para o lado para avançar ou voltar.</Text>
    <ScrollView ref={tabs} horizontal showsHorizontalScrollIndicator={false}
      onLayout={event => { viewport.current = event.nativeEvent.layout.width; revealTab(selectedRef.current); }}
      contentContainerStyle={{ gap: 24, borderBottomWidth: 1, borderBottomColor: palette.border }}>
      {rounds.map((round, index) => <Pressable key={round} accessibilityRole="tab"
        accessibilityLabel={`Rodada ${round}`} accessibilityState={{ selected: selected === index }}
        onLayout={event => { tabLayouts.current[index] = event.nativeEvent.layout; }}
        onPress={() => { select(index); pages.current?.scrollTo({ x: index * width, animated: true }); }}
        style={{ paddingVertical: 15, minHeight: 48, borderBottomWidth: 3, borderBottomColor: selected === index ? palette.green : 'transparent' }}>
        <Text numberOfLines={1} style={{ fontWeight: '700', color: selected === index ? palette.green : palette.muted }}>Rodada {round}</Text>
      </Pressable>)}
    </ScrollView>
    <View onLayout={event => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 && <ScrollView ref={pages} horizontal pagingEnabled directionalLockEnabled
        showsHorizontalScrollIndicator={false} nestedScrollEnabled scrollEventThrottle={16}
        onScroll={event => {
          const page = event.nativeEvent.contentOffset.x / width;
          // Atualiza a aba também na web, que nem sempre emite fim de momentum.
          if (Math.abs(page - Math.round(page)) < 0.001 && Math.round(page) !== selectedRef.current) select(Math.round(page));
        }}
        onMomentumScrollEnd={event => select(Math.round(event.nativeEvent.contentOffset.x / width))}
        contentContainerStyle={{ alignItems: 'flex-start' }}>
        {rounds.map((round, index) => {
          const matches = data.matches.filter(match => match.stage === 'league' && match.round === round
            && (mode === 'games' || (match.home_score !== null && match.away_score !== null)));
          return <View key={round} style={{ width, gap: 16 }}
            accessibilityElementsHidden={selected !== index} importantForAccessibility={selected === index ? 'auto' : 'no-hide-descendants'}>
            {matches.length ? <ChampionshipStages data={data} matches={matches} /> : <>
              <Text accessibilityRole="header" style={gs.heading}>Rodada {round}</Text>
              <Empty>Nenhum jogo finalizado nesta rodada.</Empty>
            </>}
          </View>;
        })}
      </ScrollView>}
    </View>
  </View>;
}
