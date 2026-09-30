import { useRef, useState } from 'react';
import { ActivityIndicator, Switch, Text, View } from 'react-native';
import { Button, palette, ui } from '@/components/fut-ui';
import { gs } from '@/components/group-screen';
import { useAuth } from '@/contexts/auth';
import { useApiResource } from '@/hooks/use-api-resource';
import { ApiError, request } from '@/services/api';

type Settings = { use_positions: boolean; use_ratings: boolean; use_wins: boolean };
const parameters: { key: keyof Settings; label: string; description: string }[] = [
  { key: 'use_positions', label: 'Posição', description: 'Distribui as posições informadas para a modalidade do evento.' },
  { key: 'use_ratings', label: 'Notas', description: 'Equilibra as avaliações privadas do grupo. Sem avaliação, considera 5,0.' },
  { key: 'use_wins', label: 'Vitórias', description: 'Equilibra as vitórias em partidas finalizadas deste grupo, de todas as temporadas.' },
];

export function DrawSettings({ groupId }: { groupId: string }) {
  const resource = useApiResource<Settings>(`/my-groups/${groupId}/draw-settings`);
  return <View style={gs.card}>
    <Text style={gs.heading}>Parâmetros de sorteio</Text>
    <Text style={ui.body}>Prioridade dos critérios ligados: posição → notas → vitórias. Quantidade de jogadores e regras de goleiros são sempre respeitadas.</Text>
    {resource.loading && <ActivityIndicator color={palette.green} />}
    {resource.error ? <><Text accessibilityRole="alert" style={ui.error}>{resource.error}</Text><Button onPress={() => void resource.refresh()}>Tentar novamente</Button></> : resource.data &&
      <DrawSettingsForm key={`${groupId}:${JSON.stringify(resource.data)}`} groupId={groupId} initial={resource.data} />}
  </View>;
}

function DrawSettingsForm({ groupId, initial }: { groupId: string; initial: Settings }) {
  const { session, expireSession } = useAuth();
  const [settings, setSettings] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const working = useRef(false);
  async function save() {
    if (!session || working.current) return;
    working.current = true; setBusy(true); setError(''); setSaved(false);
    try {
      const result = await request<Settings>(`/my-groups/${groupId}/draw-settings`, { method: 'POST', body: JSON.stringify(settings) }, session.access_token);
      setSettings(result); setSaved(true);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) expireSession();
      else setError(cause instanceof Error ? cause.message : 'Não foi possível salvar.');
    } finally { working.current = false; setBusy(false); }
  }
  return <>
    {parameters.map(parameter => <View key={parameter.key} style={{ gap: 6 }}>
      <View style={gs.row}>
        <Text style={[ui.body, { flex: 1 }]}>{parameter.label} · {settings[parameter.key] ? 'ON' : 'OFF'}</Text>
        <Switch accessibilityLabel={`Considerar ${parameter.label.toLowerCase()} no sorteio`} value={settings[parameter.key]} disabled={busy} trackColor={{ true: palette.green }}
          onValueChange={value => { setSettings(previous => ({ ...previous, [parameter.key]: value })); setSaved(false); }} />
      </View>
      <Text style={gs.muted}>{parameter.description}</Text>
    </View>)}
    <Text style={gs.muted}>Todos desligados: sorteio aleatório. Alterações valem para os próximos sorteios; times já montados permanecem como estão.</Text>
    {error ? <Text accessibilityRole="alert" style={ui.error}>{error}</Text> : null}
    {saved && <Text accessibilityRole="alert" style={gs.success}>Parâmetros de sorteio salvos.</Text>}
    <Button loading={busy} onPress={() => void save()}>Salvar parâmetros de sorteio</Button>
  </>;
}
