import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useAuth } from '@/contexts/auth';
import { useMutation } from '@/hooks/use-mutation';
import { ChampionshipDetail } from '@/services/championships';
import { Button, palette, ui } from './fut-ui';
import { Choice } from './event-ui';
import { gs } from './group-screen';

export function ChampionshipPunishments({ data, update }: { data: ChampionshipDetail; update: (data: ChampionshipDetail) => void }) {
  const { session } = useAuth();
  const action = useMutation();
  const [selected, setSelected] = useState<string[]>([]);
  const [kind, setKind] = useState<'disqualification' | 'points'>('disqualification');
  const [points, setPoints] = useState('3');
  const [reason, setReason] = useState('');
  const [confirm, setConfirm] = useState(false);
  const editable = data.owner_id === session?.profile.id && data.status === 'in_progress';
  return <>
    <Text style={ui.body}>Desclassificação: jogos futuros viram WO; o time sai das vagas de avanço. Perda de pontos: desconto na tabela, mantendo o time na disputa. Os resultados anteriores são preservados.</Text>
    {data.entries.map(entry => <View key={entry.id} style={gs.card}>
      <Text style={gs.heading}>{entry.name}</Text>
      <Text style={gs.muted}>{entry.disqualified ? 'Desclassificado' : 'Elegível'} · {entry.points_deducted} ponto(s) descontado(s)</Text>
      {entry.punishments.map((punishment, index) => <Text key={index} style={ui.body}>{punishment.kind === 'points' ? `−${punishment.points} pontos` : 'Desclassificação'} · {punishment.reason}</Text>)}
      {editable && !entry.disqualified && <Choice selected={selected.includes(entry.club_id)} disabled={action.busy} onPress={() => { setSelected(selected.includes(entry.club_id) ? selected.filter(id => id !== entry.club_id) : [...selected, entry.club_id]); setConfirm(false); }}>Selecionar time</Choice>}
    </View>)}
    {editable && <View style={gs.card}>
      <Choice selected={kind === 'disqualification'} onPress={() => { setKind('disqualification'); setConfirm(false); }}>Desclassificar da edição</Choice>
      {(data.format === 'league' || data.format === 'groups_knockout') && <Choice selected={kind === 'points'} onPress={() => { setKind('points'); setConfirm(false); }}>Perda de pontos</Choice>}
      {kind === 'points' && <TextInput accessibilityLabel="Pontos a descontar" style={ui.input} value={points} onChangeText={value => { setPoints(value.replace(/\D/g, '')); setConfirm(false); }} keyboardType="number-pad" />}
      <TextInput accessibilityLabel="Motivo da punição" placeholder="Motivo da punição" placeholderTextColor={palette.muted} style={ui.input} value={reason} onChangeText={value => { setReason(value); setConfirm(false); }} maxLength={500} />
      {confirm && <Text style={ui.error}>Confirmar {kind === 'points' ? `desconto de ${points} pontos` : 'desclassificação'} de {selected.map(id => data.entries.find(entry => entry.club_id === id)?.name).join(', ')}? Esta punição fica registrada nesta edição.</Text>}
      <Button loading={action.busy} disabled={!selected.length || !reason.trim() || (kind === 'points' && Number(points) < 1)} onPress={() => {
        if (!confirm) { setConfirm(true); return; }
        void action.mutate<ChampionshipDetail>(`/championships/${data.id}/punishments`, { club_ids: selected, kind, points: kind === 'points' ? Number(points) : 0, reason: reason.trim() }, result => { update(result); setSelected([]); setConfirm(false); setReason(''); });
      }}>{confirm ? 'Confirmar punição' : 'Revisar punição'}</Button>
      {action.error && <Text accessibilityRole="alert" style={ui.error}>{action.error}</Text>}
    </View>}
  </>;
}
