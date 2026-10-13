import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { GroupScreen, gs } from '@/components/group-screen';
import { Button, palette, ui } from '@/components/fut-ui';
import { useMutation } from '@/hooks/use-mutation';
import { Format, formats } from '@/services/championships';

export default function Create() {
  const [kind, setKind] = useState<'group' | 'championship'>('group');
  const [name, setName] = useState('');
  const [season, setSeason] = useState(String(new Date().getFullYear()));
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState<Format>('groups_knockout');
  const [capacity, setCapacity] = useState(8);
  const [homeAndAway, setHomeAndAway] = useState(false);
  const action = useMutation();
  function create() {
    void action.mutate<{ id: string }>(kind === 'group' ? '/my-groups' : '/championships',
      kind === 'group' ? { name: name.trim() } : { name: name.trim(), season: season.trim(), description: description.trim() || null, format, capacity, home_and_away: format === 'league' && homeAndAway },
      result => router.replace(kind === 'group' ? { pathname: '/groups/[groupId]', params: { groupId: result.id } } : { pathname: '/championships/[championshipId]', params: { championshipId: result.id } }));
  }
  return <GroupScreen title="O que vamos criar?" eyebrow="FUTMANAGER · CRIAR" refreshing={false} refresh={() => {}}>
    <View style={gs.row}>{(['group', 'championship'] as const).map(value => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: kind === value }} disabled={action.busy} onPress={() => setKind(value)} style={[gs.card, { flex: 1, borderColor: kind === value ? palette.green : palette.border }]}><Text style={gs.link}>{value === 'group' ? 'Grupo' : 'Campeonato'}</Text></Pressable>)}</View>
    <Text style={ui.body}>{kind === 'group' ? 'Reúna sua turma para organizar peladas e eventos.' : 'Uma edição sazonal, com times inscritos e disputa pelo título.'}</Text>
    <View style={gs.card}>
      <Text style={ui.eyebrow}>NOME</Text>
      <TextInput style={ui.input} accessibilityLabel="Nome" placeholder="Nome" placeholderTextColor={palette.muted} value={name} onChangeText={setName} maxLength={80} editable={!action.busy} />
      {kind === 'championship' && <>
        <Text style={ui.eyebrow}>TEMPORADA / EDIÇÃO</Text>
        <TextInput style={ui.input} accessibilityLabel="Temporada" value={season} onChangeText={setSeason} maxLength={80} editable={!action.busy} />
        <TextInput style={ui.input} accessibilityLabel="Descrição do campeonato" placeholder="Descrição (opcional)" placeholderTextColor={palette.muted} value={description} onChangeText={setDescription} maxLength={2000} multiline editable={!action.busy} />
        <Text style={ui.eyebrow}>FORMATO</Text>
        {(Object.keys(formats) as Format[]).map(value => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: format === value }} disabled={action.busy} onPress={() => { setFormat(value); if (value === 'cascade') setCapacity(4); else if (value !== 'groups_knockout' && value !== 'league' && ![4, 8, 16].includes(capacity)) setCapacity(8); else if (value === 'groups_knockout' && ![4, 8, 12, 16].includes(capacity)) setCapacity(8); }} style={[ui.input, { borderColor: format === value ? palette.green : palette.border }]}><Text style={gs.link}>{format === value ? '● ' : '○ '}{formats[value]}</Text></Pressable>)}
        {format === 'league' && <>
          <Text style={ui.eyebrow}>CONFRONTOS DA LIGA</Text>
          {([false, true] as const).map(value => <Pressable key={String(value)} accessibilityRole="radio" accessibilityState={{ checked: homeAndAway === value }} disabled={action.busy} onPress={() => setHomeAndAway(value)} style={[ui.input, { borderColor: homeAndAway === value ? palette.green : palette.border }]}>
            <Text style={gs.link}>{homeAndAway === value ? '● ' : '○ '}{value ? 'Ida e volta' : 'Jogo único'}</Text>
          </Pressable>)}
          <Text style={ui.body}>Todos contra todos {homeAndAway ? 'em ida e volta, com mandos invertidos' : 'em jogo único'}. {(capacity % 2 ? capacity : capacity - 1) * (homeAndAway ? 2 : 1)} rodadas · {capacity * (capacity - 1) / (homeAndAway ? 1 : 2)} jogos. Vitória vale 3 pontos e empate vale 1. O líder ao fim de todas as rodadas é campeão.</Text>
        </>}
        {format === 'cascade' && <Text style={ui.body}>4 times em chaves de vencedores e perdedores, com final geral única. Quem perde na chave dos vencedores desce; quem perde na dos perdedores é eliminado.</Text>}
        {format === 'groups_knockout' && <Text style={ui.body}>{capacity === 12 ? '4 grupos de 3, todos contra todos em turno único. Apenas o primeiro de cada grupo avança. Semifinais: A × B e C × D; depois a final. 15 jogos no total.' : 'Grupos de 4, todos contra todos em turno único. Os 2 melhores de cada grupo avançam. Com 4 times, os 2 melhores disputam a final.'} O organizador pode ajustar os grupos antes de registrar jogos.</Text>}
        <Text style={ui.eyebrow}>QUANTIDADE DE TIMES</Text>
        {format === 'league' ? <><TextInput accessibilityLabel="Quantidade estimada de times da liga" style={ui.input} value={String(capacity || '')} onChangeText={value => setCapacity(Number(value.replace(/\D/g, '')))} keyboardType="number-pad" editable={!action.busy} /><Text style={gs.muted}>Quantidade estimada, a partir de 2. As inscrições da liga não têm limite fixo; o calendário usa os times inscritos no início.</Text></> : <View style={gs.row}>{(format === 'cascade' ? [4] : format === 'groups_knockout' ? [4, 8, 12, 16] : [4, 8, 16]).map(value => <Pressable key={value} accessibilityRole="radio" accessibilityLabel={`${value} times`} accessibilityState={{ checked: capacity === value }} disabled={action.busy} onPress={() => setCapacity(value)} style={[ui.input, { flex: 1, borderColor: capacity === value ? palette.green : palette.border }]}><Text style={gs.link}>{value}</Text></Pressable>)}</View>}
      </>}
      {action.error && <Text accessibilityRole="alert" style={ui.error}>{action.error}</Text>}
      <Button onPress={create} loading={action.busy} disabled={!name.trim() || (kind === 'championship' && (!season.trim() || capacity < 2))}>Criar {kind === 'group' ? 'grupo' : 'campeonato'}</Button>
    </View>
  </GroupScreen>;
}
