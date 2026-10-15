import { router } from 'expo-router';
import { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, palette, ui } from './fut-ui';
import { useResponsive } from '@/contexts/responsive';

export function GroupScreen({ title, subtitle, children, loading, error, refreshing, refresh, eyebrow = 'FUTMANAGER · SEU GRUPO' }: PropsWithChildren<{
  title: string; subtitle?: string; loading?: boolean; error?: string; refreshing: boolean; refresh: () => void; eyebrow?: string;
}>) {
  const layout = useResponsive();
  return <SafeAreaView style={ui.screen}><ScrollView contentContainerStyle={[ui.content, { maxWidth: layout.contentMaxWidth, padding: layout.padding }]}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[palette.green]} tintColor={palette.green} />}>
    <View style={gs.top}><Pressable accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={gs.back}><Text style={gs.link}>← Voltar</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Atualizar" disabled={refreshing} onPress={refresh} style={gs.back}><Text style={gs.link}>{refreshing ? 'Atualizando…' : 'Atualizar'}</Text></Pressable></View>
    <View style={{ gap: 8 }}><Text style={ui.eyebrow}>{eyebrow}</Text><Text style={ui.title}>{title}</Text>{subtitle ? <Text style={ui.body}>{subtitle}</Text> : null}</View>
    {loading ? <ActivityIndicator size="large" color={palette.green} /> : error ? <View style={{ gap: 12 }}><Text style={ui.error} accessibilityRole="alert">{error}</Text><Button onPress={refresh} loading={refreshing}>Tentar novamente</Button></View> : children}
  </ScrollView></SafeAreaView>;
}

export function Empty({ children }: PropsWithChildren) { return <View style={gs.card}><Text style={ui.body}>{children}</Text></View>; }
export const gs = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: { paddingVertical: 12, minHeight: 44 },
  link: { fontSize: 14, fontWeight: '700', color: palette.green },
  card: { padding: 22, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.paper, borderRadius: 20, gap: 12 },
  heading: { fontSize: 21, fontWeight: '700', color: palette.ink },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  badge: { fontSize: 12, fontWeight: '600', color: palette.green },
  muted: { fontSize: 13, color: palette.muted, lineHeight: 20 },
  success: { padding: 14, borderRadius: 12, backgroundColor: '#E1EEDD', color: palette.green, lineHeight: 22 },
});
