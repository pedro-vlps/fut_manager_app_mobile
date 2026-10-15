import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brand, Button, palette, ui } from '@/components/fut-ui';
import { useAuth } from '@/contexts/auth';
import { PositionSelector, Positions } from '@/components/position-selector';
import { request } from '@/services/api';
import { passwordRequirements, validNewPassword } from '@/services/password-policy';
import { useResponsive } from '@/contexts/responsive';

export default function LoginScreen() {
  const layout = useResponsive();
  const { signIn, notice } = useAuth();
  const [email, setEmail] = useState('');
  const [registering, setRegistering] = useState(false);
  const [name, setName] = useState('');
  const [positions, setPositions] = useState<Positions>({});
  const [success, setSuccess] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordInput = useRef<TextInput>(null);
  const submitting = useRef(false);

  async function submit() {
    if (submitting.current) return;
    if (registering && (!name.trim() || !Object.values(positions).some(p => p.length))) {
      setError('Informe seu nome e pelo menos uma posição.');
      return;
    }
    if (registering && !validNewPassword(password)) {
      setError('Sua senha precisa cumprir todos os critérios abaixo.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !password) {
      setError('Informe um e-mail válido e sua senha para entrar.');
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      if (registering) {
        await request('/auth/register', { method: 'POST', body: JSON.stringify({ name: name.trim(), email: email.trim(), password, positions }) });
        setRegistering(false);
        setSuccess('Perfil criado! Entre com seu e-mail e senha.');
      } else await signIn(email, password);
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível entrar.'); }
    finally { submitting.current = false; setBusy(false); }
  }

  return <SafeAreaView style={ui.screen}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
        <View style={[styles.container, layout.wideLogin && { maxWidth: 1120, flexDirection: 'row', gap: 64, alignItems: 'center', padding: 40 }]}>
          <View style={[{ gap: 28 }, layout.wideLogin && { flex: 1, minWidth: 0 }]}>
          <Brand />
          <View style={[styles.hero, layout.wideLogin && { padding: 40, minHeight: 460, justifyContent: 'center' }]}>
            <Text style={styles.heroEyebrow}>SEU FUTEBOL COMEÇA AQUI</Text>
            <Text style={[styles.heroTitle, layout.wideLogin && { fontSize: 42, lineHeight: 49 }]}>O jogo é melhor{'\n'}com a sua turma.</Text>
            <Text style={styles.heroBody}>Seus grupos, suas peladas e a galera que joga junto.</Text>
            <View style={[styles.pitch, layout.wideLogin && { height: 156, marginTop: 30 }]} accessible={false}><View style={styles.halfway} /><View style={styles.circle} /><View style={styles.goal} /></View>
          </View>
          </View>
          <View style={[{ gap: 28 }, layout.wideLogin && { width: 420, minWidth: 0 }]}>
          <View style={{ gap: 8 }}><Text style={ui.title}>{registering ? 'Crie seu perfil' : 'Entre em campo'}</Text><Text style={ui.body}>{registering ? 'Conte em quais modalidades e posições você joga.' : 'Acesse sua conta para encontrar seus grupos.'}</Text></View>
          <View style={{ gap: 18 }}>
            {registering && <View style={{ gap: 8 }}><Text style={styles.label}>Nome</Text><TextInput accessibilityLabel="Nome" value={name} onChangeText={setName} editable={!busy} maxLength={120} style={ui.input} autoComplete="name" /></View>}
            <View style={{ gap: 8 }}><Text style={styles.label}>E-mail</Text><TextInput accessibilityLabel="E-mail" style={ui.input} placeholder="voce@exemplo.com" placeholderTextColor={palette.muted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" returnKeyType="next" onSubmitEditing={() => passwordInput.current?.focus()} editable={!busy} /></View>
            <View style={{ gap: 8 }}><Text style={styles.label}>Senha</Text><View style={styles.passwordRow}>
              <TextInput ref={passwordInput} accessibilityLabel="Senha" style={[ui.input, styles.password]} placeholder="Sua senha" placeholderTextColor={palette.muted} value={password} onChangeText={setPassword} secureTextEntry={!visible} autoCapitalize="none" autoCorrect={false} autoComplete="current-password" textContentType="password" returnKeyType="go" onSubmitEditing={submit} editable={!busy} />
              <Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'} onPress={() => setVisible(!visible)} style={styles.visibility}><Text style={styles.visibilityText}>{visible ? 'Ocultar' : 'Mostrar'}</Text></Pressable>
            </View></View>
            {registering && <View style={{ gap: 6 }}>
              <Text style={styles.label}>Critérios da senha</Text>
              {passwordRequirements(password).map(requirement => <Text key={requirement.id}
                accessibilityLabel={`${requirement.satisfied ? 'Atendido' : 'Pendente'}: ${requirement.label}`}
                style={[ui.body, { color: requirement.satisfied ? palette.green : palette.muted }]}>
                {requirement.satisfied ? '✓' : '○'} {requirement.label}
              </Text>)}
            </View>}
            {(error || notice) && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={ui.error}>{error || notice}</Text>}
            {registering && <PositionSelector value={positions} onChange={setPositions} disabled={busy} />}
            {!!success && <Text accessibilityLiveRegion="polite" style={ui.body}>{success}</Text>}
            <Button onPress={submit} loading={busy} disabled={registering && (!validNewPassword(password) || !Object.values(positions).some(p => p.length))}>{registering ? 'Criar perfil' : 'Entrar'}</Button>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setRegistering(!registering); setError(null); setSuccess(''); }} style={styles.visibility}>
              <Text style={[styles.visibilityText, { textAlign: 'center' }]}>{registering ? 'Já tenho conta · Entrar' : 'Ainda não tenho conta · Criar perfil'}</Text>
            </Pressable>
          </View>
          <Text style={styles.footer}>Sua turma. Seu jogo. Seu momento.</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center' },
  container: { width: '100%', maxWidth: 480, alignSelf: 'center', padding: 24, gap: 28 },
  hero: { backgroundColor: palette.ink, borderRadius: 24, padding: 24, overflow: 'hidden', gap: 14 },
  heroEyebrow: { color: palette.lime, fontSize: 10, fontWeight: '800', letterSpacing: 1.8 },
  heroTitle: { color: '#FFFFFF', fontSize: 29, lineHeight: 35, fontWeight: '800', letterSpacing: -0.8 },
  heroBody: { color: '#BDCEC4', fontSize: 14, lineHeight: 21, maxWidth: 255 },
  pitch: { height: 58, borderWidth: 1, borderColor: '#587365', borderRadius: 8, marginTop: 6, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  halfway: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: '#587365' },
  circle: { width: 42, height: 42, borderWidth: 1, borderColor: '#587365', borderRadius: 21 },
  goal: { position: 'absolute', left: -1, width: 24, height: 36, borderWidth: 1, borderColor: '#587365' },
  label: { fontSize: 14, fontWeight: '600', color: palette.ink },
  passwordRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: palette.border, borderRadius: 14, backgroundColor: palette.paper },
  password: { flex: 1, minWidth: 0, borderWidth: 0, backgroundColor: 'transparent' },
  visibility: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 14 },
  visibilityText: { color: palette.green, fontSize: 13, fontWeight: '700' },
  footer: { textAlign: 'center', color: palette.muted, fontSize: 12 },
});
