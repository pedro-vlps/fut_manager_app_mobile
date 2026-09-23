import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { palette, ui } from '@/components/fut-ui';
import { Empty, GroupScreen, gs } from '@/components/group-screen';
import { useApiResource } from '@/hooks/use-api-resource';
import { Ranking } from '@/services/groups';

const categories = [
  ['goals', 'Artilharia'], ['assists', 'Assistências'], ['wins', 'Vitórias'],
  ['losses', 'Derrotas'], ['own_goals', 'Gols contra'], ['yellow_cards', 'Amarelos'],
  ['red_cards', 'Vermelhos'], ['goals_conceded', 'Gols sofridos'],
] as const;
type Metric = typeof categories[number][0];

export default function Rankings() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const resource = useApiResource<Ranking[]>(`/my-groups/${groupId}/rankings`);
  return <GroupScreen title="Rankings do grupo" subtitle="Estatísticas das partidas finalizadas. Empates dividem a mesma posição." {...resource}>
    <RankingTabs key={groupId} people={resource.data ?? []} />
  </GroupScreen>;
}

function RankingTabs({ people }: { people: Ranking[] }) {
  const [selected, setSelected] = useState(0);
  const [width, setWidth] = useState(0);
  const tabs = useRef<ScrollView>(null);
  const pages = useRef<ScrollView>(null);
  const tabLayouts = useRef<Record<number, { x: number; width: number }>>({});
  const selectedRef = useRef(0);
  const viewport = useRef(0);

  function revealTab(index: number) {
    const tab = tabLayouts.current[index];
    if (tab) tabs.current?.scrollTo({ x: Math.max(0, tab.x - (viewport.current - tab.width) / 2), animated: true });
  }
  function select(index: number) {
    selectedRef.current = index;
    setSelected(index);
    revealTab(index);
  }
  useEffect(() => {
    // Mantém a página selecionada ao girar o aparelho ou redimensionar a janela.
    pages.current?.scrollTo({ x: selectedRef.current * width, animated: false });
  }, [width]);

  return <View style={{ gap: 20 }}>
    <ScrollView ref={tabs} horizontal showsHorizontalScrollIndicator={false}
      onLayout={event => { viewport.current = event.nativeEvent.layout.width; revealTab(selectedRef.current); }}
      contentContainerStyle={{ gap: 24, borderBottomWidth: 1, borderBottomColor: palette.border }}>
      {categories.map(([key, label], index) => <Pressable key={key} accessibilityRole="tab"
        accessibilityState={{ selected: selected === index }} accessibilityLabel={label}
        onLayout={event => { tabLayouts.current[index] = event.nativeEvent.layout; }}
        onPress={() => { select(index); pages.current?.scrollTo({ x: index * width, animated: true }); }}
        style={{ paddingVertical: 15, borderBottomWidth: 3, borderBottomColor: selected === index ? palette.green : 'transparent' }}>
        <Text numberOfLines={1} style={{ fontWeight: '700', color: selected === index ? palette.green : palette.muted }}>{label}</Text>
      </Pressable>)}
    </ScrollView>
    <View onLayout={event => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 && <ScrollView ref={pages} horizontal pagingEnabled directionalLockEnabled
        showsHorizontalScrollIndicator={false} nestedScrollEnabled scrollEventThrottle={16}
        onMomentumScrollEnd={event => select(Math.max(0, Math.min(categories.length - 1, Math.round(event.nativeEvent.contentOffset.x / width))))}
        contentContainerStyle={{ alignItems: 'flex-start' }}>
        {categories.map(([metric, label], index) => <View key={metric} style={{ width, gap: 16 }}
          accessibilityElementsHidden={selected !== index} importantForAccessibility={selected === index ? 'auto' : 'no-hide-descendants'}>
          <Text accessibilityRole="header" style={gs.heading}>{label}</Text>
          <RankingList people={people} metric={metric} />
        </View>)}
      </ScrollView>}
    </View>
  </View>;
}

function RankingList({ people, metric }: { people: Ranking[]; metric: Metric }) {
  const rows = [...people].filter(p => metric === 'goals_conceded' ? p.goalkeeper_matches > 0 : p[metric] > 0)
    .sort((a, b) => (metric === 'goals_conceded' ? a[metric] - b[metric] : b[metric] - a[metric]) || a.name.localeCompare(b.name, 'pt-BR') || a.id.localeCompare(b.id));
  return <>
    {metric === 'goals_conceded' && <Text style={ui.body}>Goleiros com menos gols sofridos no total. O número de partidas como goleiro aparece em cada linha.</Text>}
    {rows.length === 0 && <Empty>Ainda não há estatísticas para esta categoria.</Empty>}
    {rows.map((person, index) => <View key={`${person.is_guest}-${person.id}`} style={[gs.card, gs.row]}>
      <Text style={gs.badge}>#{rows.findIndex(p => p[metric] === person[metric]) + 1}</Text>
      <View style={{ flex: 1, gap: 5 }}><Text style={gs.heading}>{person.name}</Text><Text style={gs.muted}>{person.is_guest ? 'Convidado · ' : ''}{metric === 'goals_conceded' ? person.goalkeeper_matches : person.matches} partida(s){metric === 'goals_conceded' ? ' como goleiro' : ''}</Text></View>
      <Text style={[ui.title, { color: index === 0 ? palette.green : palette.ink }]}>{person[metric]}</Text>
    </View>)}
  </>;
}
