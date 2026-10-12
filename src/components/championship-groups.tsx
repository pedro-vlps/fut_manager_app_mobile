import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAuth } from '@/contexts/auth';
import { useMutation } from '@/hooks/use-mutation';
import { ChampionshipDetail } from '@/services/championships';
import { Button, palette, ui } from './fut-ui';
import { gs } from './group-screen';

export function ChampionshipGroups({ data, update }: { data: ChampionshipDetail; update: (data: ChampionshipDetail) => void }) {
  const { session } = useAuth();
  const action = useMutation();
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const size = data.capacity === 12 ? 3 : 4;
  const pools = Array.from({ length: data.capacity / size }, (_, i) => String.fromCharCode(65 + i));
  const assignments = draft ?? Object.fromEntries(data.entries.map(entry => [entry.club_id, entry.pool ?? String.fromCharCode(65 + Math.floor((entry.seed - 1) / size))]));
  const editable = data.owner_id === session?.profile.id && data.status !== 'finished' && !data.matches.some(match => match.home_score !== null || match.actions.length > 0 || match.home_goalkeeper_id || match.away_goalkeeper_id);
  const complete = data.entries.length === data.capacity;
  function choose(id: string) {
    setSaved(false);
    if (!selected) { setSelected(id); return; }
    if (selected !== id) setDraft({ ...assignments, [selected]: assignments[id], [id]: assignments[selected] });
    setSelected(null);
  }
  return <>
    <Text style={ui.body}>{data.capacity === 12 ? '4 grupos de 3 times. O líder de cada grupo avança: semifinal A × B e C × D, seguida da final.' : `Grupos de ${size} times. Os dois primeiros de cada grupo avançam ao mata-mata.`}</Text>
    {editable && <Text style={gs.muted}>{complete ? 'Selecione um time e depois outro para trocar seus grupos. Salve a divisão antes de registrar qualquer jogo.' : 'Preencha todas as vagas para editar a divisão dos grupos.'}</Text>}
    {!editable && <Text style={gs.muted}>Apenas o organizador pode alterar os grupos, antes do primeiro resultado, lance ou goleiro registrado.</Text>}
    {selected && <Text accessibilityRole="alert" style={gs.success}>Selecione outro time para trocar com {data.entries.find(entry => entry.club_id === selected)?.name}. Toque no mesmo time para cancelar.</Text>}
    {pools.map(pool => <View key={pool} style={gs.card}>
      <Text style={gs.heading}>Grupo {pool}</Text>
      {data.entries.filter(entry => assignments[entry.club_id] === pool).map(entry => <Pressable key={entry.club_id} accessibilityRole="button" accessibilityLabel={`Trocar grupo de ${entry.name}`} accessibilityState={{ selected: selected === entry.club_id, disabled: !editable || !complete || action.busy }} disabled={!editable || !complete || action.busy} onPress={() => choose(entry.club_id)} style={[ui.input, selected === entry.club_id && { borderColor: palette.green, backgroundColor: '#E1EEDD' }]}>
        <Text style={gs.link}>{entry.name}{selected === entry.club_id ? ' · selecionado' : ''}</Text>
      </Pressable>)}
      <Text style={gs.muted}>{data.entries.filter(entry => assignments[entry.club_id] === pool).length}/{size} times</Text>
    </View>)}
    {action.error && <Text accessibilityRole="alert" style={ui.error}>{action.error}</Text>}
    {saved && <Text accessibilityRole="alert" style={gs.success}>Grupos salvos.</Text>}
    {editable && draft && <>
      <Text style={gs.muted}>Há alterações ainda não salvas.</Text>
      <Button loading={action.busy} disabled={!complete} onPress={() => void action.mutate<ChampionshipDetail>(`/championships/${data.id}/groups`, { groups: pools.map(pool => data.entries.filter(entry => assignments[entry.club_id] === pool).map(entry => entry.club_id)) }, result => { update(result); setDraft(null); setSelected(null); setSaved(true); })}>Salvar grupos</Button>
      <Button disabled={action.busy} onPress={() => { setDraft(null); setSelected(null); }}>Descartar alterações</Button>
    </>}
  </>;
}
