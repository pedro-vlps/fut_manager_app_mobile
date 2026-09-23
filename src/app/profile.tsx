import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Button, palette, ui } from '@/components/fut-ui';
import { GroupScreen, gs } from '@/components/group-screen';
import { Catalog, Positions, PositionSelector } from '@/components/position-selector';
import { useAuth } from '@/contexts/auth';
import { useApiResource } from '@/hooks/use-api-resource';
import { ApiError, Profile, request } from '@/services/api';

export default function ProfileScreen() {
  const resource = useApiResource<Profile>('/auth/me');
  const catalog = useApiResource<Catalog>('/auth/modalities');
  const { session, updateProfile, expireSession } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Positions>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const working = useRef(false);
  const alive = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const valid = Object.values(draft).some(positions => positions.length > 0);
  async function save() {
    if (!session || working.current || !valid) return;
    working.current = true;
    setBusy(true);
    setError('');
    try {
      const profile = await request<Profile>('/auth/me/positions', { method: 'POST', body: JSON.stringify({ positions: draft }) }, session.access_token);
      updateProfile(profile);
      if (!alive.current) return;
      resource.update(profile);
      setEditing(false);
      setSuccess('Posições atualizadas!');
    } catch (cause) {
      if (!alive.current) return;
      if (cause instanceof ApiError && cause.status === 401) expireSession();
      else setError(cause instanceof Error ? cause.message : 'Não foi possível salvar as posições.');
    } finally { working.current = false; if (alive.current) setBusy(false); }
  }
  const profile = resource.data;
  return <GroupScreen title="Meu perfil" eyebrow="FUTMANAGER · JOGADOR" subtitle="Seus dados e suas posições em campo."
    loading={resource.loading || catalog.loading} error={resource.error || catalog.error}
    refreshing={resource.refreshing || catalog.refreshing}
    refresh={() => { if (!editing && !working.current) { void resource.refresh(); void catalog.refresh(); } }}>
    {profile && <>
      <View style={gs.card}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: palette.lime, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={ui.title}>{profile.name.trim().charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={gs.heading}>{profile.name}</Text>
        <Text selectable style={ui.body}>{profile.email}</Text>
      </View>
      {!!success && <Text accessibilityLiveRegion="polite" style={gs.success}>{success}</Text>}
      {editing ? <View style={gs.card}>
        <PositionSelector value={draft} onChange={setDraft} disabled={busy} />
        {!valid && <Text style={ui.body}>Selecione pelo menos uma posição em uma modalidade para salvar.</Text>}
        {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
        <Button onPress={() => void save()} loading={busy} disabled={!valid}>Salvar posições</Button>
        <Button disabled={busy} onPress={() => { setEditing(false); setError(''); }}>Cancelar</Button>
      </View> : <>
        <Text style={gs.heading}>Modalidades e posições</Text>
        {Object.entries(profile.positions).filter(([, positions]) => positions.length).map(([sport, positions]) => <View key={sport} style={gs.card}>
          <Text style={gs.heading}>{catalog.data?.[sport]?.label ?? sport}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{positions.map(position => <Text key={position} style={{ color: palette.green, backgroundColor: '#E1EEDD', padding: 10, borderRadius: 12 }}>{catalog.data?.[sport]?.positions[position] ?? position}</Text>)}</View>
        </View>)}
        {!Object.values(profile.positions).some(p => p.length) && <Text style={ui.body}>Você ainda não informou suas posições. Adicione onde gosta de jogar.</Text>}
        <Button disabled={resource.refreshing} onPress={() => { setDraft(Object.fromEntries(Object.entries(profile.positions).map(([sport, positions]) => [sport, [...positions]]))); setSuccess(''); setError(''); setEditing(true); }}>Alterar posições</Button>
      </>}
    </>}
  </GroupScreen>;
}
