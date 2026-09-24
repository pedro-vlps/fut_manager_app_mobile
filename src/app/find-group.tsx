import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Button, palette, ui } from '@/components/fut-ui';
import { GroupScreen, gs } from '@/components/group-screen';
import { useAuth } from '@/contexts/auth';
import { ApiError, request } from '@/services/api';
import { DiscoveredGroup } from '@/services/groups';

export default function FindGroup() {
  const { session, expireSession } = useAuth();
  const [code, setCode] = useState('');
  const [result, setResult] = useState<DiscoveredGroup>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const submitting = useRef(false);
  function failure(cause: unknown) {
    if (cause instanceof ApiError && cause.status === 401) expireSession();
    else setError(cause instanceof Error ? cause.message : 'Não foi possível concluir.');
  }
  async function search() {
    if (!session || submitting.current || !/^[A-Z0-9]{6}$/.test(code)) return;
    submitting.current = true;
    setBusy(true); setError(undefined); setResult(undefined);
    try {
      setResult(await request<DiscoveredGroup>(`/group-discovery/search?code=${encodeURIComponent(code)}`, {}, session.access_token));
    } catch (cause) { failure(cause); }
    finally { submitting.current = false; setBusy(false); }
  }
  async function join() {
    if (!session || !result || submitting.current) return;
    submitting.current = true;
    setBusy(true); setError(undefined);
    try {
      await request(`/group-discovery/${result.id}/requests`, { method: 'POST' }, session.access_token);
      setResult({ ...result, request_status: 'pending' });
    } catch (cause) { failure(cause); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <GroupScreen title="Entrar em um grupo" eyebrow="FUTMANAGER · ENCONTRE SUA TURMA" subtitle="Peça o código de 6 caracteres ao organizador da pelada." refreshing={false} refresh={() => { if (result && !busy) void search(); }}>
    <View style={gs.card}>
      <Text style={ui.eyebrow}>CÓDIGO DO GRUPO</Text>
      <TextInput accessibilityLabel="Código do grupo" placeholder="Ex.: AA3IM0" placeholderTextColor={palette.muted} style={ui.input} value={code} maxLength={6} autoCapitalize="characters" autoCorrect={false} editable={!busy} onChangeText={value => { setCode(value.replace(/[^a-z0-9]/gi, '').toUpperCase()); setResult(undefined); setError(undefined); }} onSubmitEditing={() => void search()} returnKeyType="search" />
      <Button onPress={() => void search()} loading={busy} disabled={code.length !== 6}>Buscar grupo</Button>
    </View>
    {error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
    {result && <View style={gs.card}>
      <Text style={gs.badge}>{result.code}</Text>
      <Text style={gs.heading}>{result.name}</Text>
      {result.description && <Text style={ui.body}>{result.description}</Text>}
      {result.membership === 'active' ? <Button onPress={() => router.replace({ pathname: '/groups/[groupId]', params: { groupId: result.id } })}>Você já participa · Abrir grupo</Button>
        : result.membership === 'blocked' ? <Text style={ui.error}>Sua entrada neste grupo está bloqueada.</Text>
        : result.request_status === 'pending' ? <Text accessibilityRole="alert" style={gs.success}>Pedido enviado. Aguarde a aprovação de um owner ou administrador.</Text>
        : <>
          {result.request_status === 'rejected' && <Text style={ui.body}>Seu pedido anterior foi recusado. Você pode enviar um novo pedido.</Text>}
          <Button onPress={() => void join()} loading={busy}>Pedir para entrar</Button>
          <Text style={gs.muted}>O acesso será liberado depois que seu pedido for aceito.</Text>
        </>}
    </View>}
  </GroupScreen>;
}
