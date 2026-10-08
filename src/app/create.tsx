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
  const action = useMutation();
  function create() {
    void action.mutate<{ id: string }>(kind === 'group' ? '/my-groups' : '/championships',
      kind === 'group' ? { name: name.trim() } : { name: name.trim(), season: season.trim(), description: description.trim() || null, format, capacity },
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
        {(Object.keys(formats) as Format[]).map(value => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: format === value }} disabled={action.busy} onPress={() => { setFormat(value); if (value === 'cascade') setCapacity(4); }} style={[ui.input, { borderColor: format === value ? palette.green : palette.border }]}><Text style={gs.link}>{format === value ? '● ' : '○ '}{formats[value]}</Text></Pressable>)}
        {format === 'cascade' && <Text style={ui.body}>4 times em chaves de vencedores e perdedores, com final geral única. Quem perde na chave dos vencedores desce; quem perde na dos perdedores é eliminado.</Text>}
        {format === 'groups_knockout' && <Text style={ui.body}>Grupos de 4, todos contra todos em turno único. Os 2 melhores de cada grupo avançam. Com 4 times, os 2 melhores disputam a final.</Text>}
        <Text style={ui.eyebrow}>QUANTIDADE DE TIMES</Text>
        <View style={gs.row}>{(format === 'cascade' ? [4] : [4, 8, 16]).map(value => <Pressable key={value} accessibilityRole="radio" accessibilityLabel={`${value} times`} accessibilityState={{ checked: capacity === value }} disabled={action.busy} onPress={() => setCapacity(value)} style={[ui.input, { flex: 1, borderColor: capacity === value ? palette.green : palette.border }]}><Text style={gs.link}>{value}</Text></Pressable>)}</View>
      </>}
      {action.error && <Text accessibilityRole="alert" style={ui.error}>{action.error}</Text>}
      <Button onPress={create} loading={action.busy} disabled={!name.trim() || (kind === 'championship' && !season.trim())}>Criar {kind === 'group' ? 'grupo' : 'campeonato'}</Button>
    </View>
  </GroupScreen>;
}
