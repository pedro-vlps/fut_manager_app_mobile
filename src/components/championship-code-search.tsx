import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useAuth } from '@/contexts/auth';
import { ApiError, request } from '@/services/api';
import { Championship, formats, statuses } from '@/services/championships';
import { Button, palette, ui } from './fut-ui';
import { gs } from './group-screen';

export function ChampionshipCodeSearch() {
  const { session, expireSession } = useAuth();
  const [code, setCode] = useState('');
  const [result, setResult] = useState<Championship>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  async function search() {
    if (!session || submitting.current || code.length !== 6) return;
    submitting.current = true; setBusy(true); setError(undefined); setResult(undefined);
    try {
      setResult(await request<Championship>(`/championship-discovery/search?code=${encodeURIComponent(code)}`, {}, session.access_token));
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) expireSession();
      else setError(cause instanceof Error ? cause.message : 'Não foi possível buscar o campeonato.');
    } finally { submitting.current = false; setBusy(false); }
  }
  return <View style={gs.card}>
    <Text style={gs.heading}>Entrar com código de convite</Text>
    <Text style={ui.body}>Peça o código de 6 caracteres ao organizador para inscrever seu time.</Text>
    <TextInput accessibilityLabel="Código do campeonato" placeholder="Ex.: AA3IM0" placeholderTextColor={palette.muted} style={ui.input} value={code} maxLength={6} autoCapitalize="characters" autoCorrect={false} editable={!busy} onChangeText={value => { setCode(value.replace(/[^a-z0-9]/gi, '').toUpperCase()); setResult(undefined); setError(undefined); }} onSubmitEditing={() => void search()} returnKeyType="search" />
    <Button loading={busy} disabled={code.length !== 6} onPress={() => void search()}>Buscar campeonato pelo código</Button>
    {error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
    {result && <View style={{ gap: 12 }}>
      <Text style={gs.heading}>{result.name}</Text><Text style={ui.body}>{result.season} · {formats[result.format]} · {statuses[result.status]}</Text>
      <Button onPress={() => router.push(result.status === 'registration' ? { pathname: '/championships/history', params: { championshipId: result.id, section: 'registration' } } : { pathname: '/championships/[championshipId]', params: { championshipId: result.id } })}>{result.status === 'registration' ? 'Escolher time para inscrever' : 'Abrir campeonato'}</Button>
    </View>}
  </View>;
}
