import { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export const palette = { background: '#F4F6F2', paper: '#FFFFFF', ink: '#152B24', muted: '#65746D', green: '#176B49', lime: '#D6F58A', border: '#DFE6DE', danger: '#A32F36' };

export function Brand() {
  return <View style={ui.brand}><View style={ui.logo}><Text style={ui.logoText}>FM</Text></View><Text style={ui.brandText}>fut<Text style={{ color: palette.green }}>manager</Text></Text></View>;
}

export function Button({ children, onPress, loading = false, disabled = false }: PropsWithChildren<{ onPress: () => void; loading?: boolean; disabled?: boolean }>) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: loading || disabled, busy: loading }} disabled={loading || disabled} onPress={onPress} style={({ pressed }) => [ui.button, (loading || disabled || pressed) && { opacity: 0.65 }]}>
    {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={ui.buttonText}>{children}</Text>}
  </Pressable>;
}

export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 24, gap: 24 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 38, height: 38, borderRadius: 12, backgroundColor: palette.green, justifyContent: 'center', alignItems: 'center' },
  logoText: { color: palette.lime, fontWeight: '900', fontSize: 15 },
  brandText: { fontWeight: '800', color: palette.ink, fontSize: 22, letterSpacing: -0.8 },
  eyebrow: { color: palette.green, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -1, color: palette.ink },
  body: { color: palette.muted, fontSize: 15, lineHeight: 23 },
  input: { borderWidth: 1, borderColor: palette.border, backgroundColor: palette.paper, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 15, color: palette.ink, fontSize: 16, minHeight: 54 },
  button: { minHeight: 54, borderRadius: 14, backgroundColor: palette.green, justifyContent: 'center', alignItems: 'center', padding: 15 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  error: { color: palette.danger, backgroundColor: '#FCEEEF', borderRadius: 12, padding: 14, lineHeight: 21 },
});
