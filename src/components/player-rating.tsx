import { useRef, useState } from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import { Button, palette, ui } from '@/components/fut-ui';
import { gs } from '@/components/group-screen';
import { useAuth } from '@/contexts/auth';
import { useApiResource } from '@/hooks/use-api-resource';
import { ApiError, request } from '@/services/api';

type Rating = { rating: number | null };

export function PlayerRating({ groupId, profileId }: { groupId: string; profileId: string }) {
  const path = `/my-groups/${groupId}/members/${profileId}/rating`;
  const resource = useApiResource<Rating>(path);
  return <View style={gs.card}>
    <Text style={gs.heading}>Avaliação privada</Text>
    <Text style={ui.body}>Nota deste jogador neste grupo, de 0 a 10, com até uma casa decimal. Owners e administradores podem consultar e editar as avaliações, inclusive a própria.</Text>
    {resource.loading && <ActivityIndicator color={palette.green} />}
    {resource.error ? <><Text accessibilityRole="alert" style={ui.error}>{resource.error}</Text><Button onPress={() => void resource.refresh()}>Tentar novamente</Button></> : resource.data &&
      <RatingForm key={`${path}:${resource.data.rating}`} path={path} initial={resource.data} />}
  </View>;
}

function RatingForm({ path, initial }: { path: string; initial: Rating }) {
  const { session, expireSession } = useAuth();
  const [value, setValue] = useState(initial.rating === null ? '' : initial.rating.toFixed(1).replace('.', ','));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const working = useRef(false);
  const normalized = value.trim().replace(',', '.');
  const valid = normalized === '' || (/^\d{1,2}(\.\d)?$/.test(normalized) && Number(normalized) <= 10);
  async function save() {
    if (!session || working.current || !valid) return;
    working.current = true; setBusy(true); setError(''); setSaved(false);
    try {
      await request<Rating>(path, { method: 'POST', body: JSON.stringify({ rating: normalized === '' ? null : Number(normalized) }) }, session.access_token);
      setSaved(true);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) expireSession();
      else setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a avaliação.');
    } finally { working.current = false; setBusy(false); }
  }
  return <>
    <TextInput accessibilityLabel="Nota privada do jogador" placeholder="Ex.: 7,5" value={value} onChangeText={text => { setValue(text); setSaved(false); }}
      keyboardType="decimal-pad" maxLength={5} editable={!busy} style={ui.input} />
    {!valid && <Text style={ui.error}>Informe uma nota de 0 a 10, com no máximo uma casa decimal.</Text>}
    <Text style={gs.muted}>Deixe vazio e salve para remover a avaliação. Jogadores sem nota recebem o valor neutro 5,0 apenas no cálculo do sorteio. Mudanças podem ser feitas a qualquer momento e valem para os próximos sorteios.</Text>
    {error ? <Text accessibilityRole="alert" style={ui.error}>{error}</Text> : null}
    {saved && <Text accessibilityRole="alert" style={gs.success}>Avaliação salva.</Text>}
    <Button onPress={() => void save()} loading={busy} disabled={!valid}>Salvar avaliação</Button>
  </>;
}
