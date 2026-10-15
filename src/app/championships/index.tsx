import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { GroupScreen, gs } from '@/components/group-screen';
import { Button, palette, ui } from '@/components/fut-ui';
import { useApiResource } from '@/hooks/use-api-resource';
import { Championship, formats, statuses } from '@/services/championships';
import { ChampionshipCodeSearch } from '@/components/championship-code-search';
import { ResponsiveGrid } from '@/components/responsive-grid';

export default function Championships() {
  const resource = useApiResource<Championship[]>('/championship-feed');
  const [query, setQuery] = useState('');
  const filtered = resource.data?.filter(item => `${item.name} ${item.season}`.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR')));
  return <GroupScreen title="Feed de campeonatos" eyebrow="FUTMANAGER · TEMPORADAS" subtitle="Acompanhe jogos, resultados e estatísticas de qualquer campeonato, mesmo sem inscrever um time." {...resource} refresh={() => void resource.refresh()}>
    <Button onPress={() => router.push('/create')}>Criar grupo ou campeonato</Button>
    <Button onPress={() => router.push('/clubs')}>Meus times e convites</Button>
    <ChampionshipCodeSearch />
    <TextInput style={ui.input} accessibilityLabel="Buscar campeonato" placeholder="Buscar campeonato ou temporada" placeholderTextColor={palette.muted} value={query} onChangeText={setQuery} />
    {!filtered?.length && <Text style={ui.body}>Nenhum campeonato encontrado.</Text>}
    <ResponsiveGrid>{filtered?.map(item => <Pressable key={item.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/championships/[championshipId]', params: { championshipId: item.id } })} style={[gs.card, { height: '100%' }]}>
      <Text style={gs.badge}>{statuses[item.status]} · {item.season}</Text>
      <Text style={gs.heading}>{item.name}</Text>
      <Text style={ui.body}>{formats[item.format]} · {item.capacity} times</Text>
      <View><Text style={gs.link}>Abrir campeonato →</Text></View>
    </Pressable>)}</ResponsiveGrid>
  </GroupScreen>;
}
