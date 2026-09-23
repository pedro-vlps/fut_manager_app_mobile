import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brand, Button, palette, ui } from '@/components/fut-ui';
import { useAuth } from '@/contexts/auth';
import { ApiError, Group, request } from '@/services/api';

const roles = { owner: 'Organizador', admin: 'Administrador', member: 'Jogador' };
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function HomeScreen() {
  const { session, signOut, expireSession } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef({ value: 0 });
  const token = session?.access_token;

  const load = useCallback(() => {
    if (!token) return;
    const id = ++generation.current.value;
    return request<Group[]>('/auth/me/groups', {}, token).then(data => {
      if (id === generation.current.value) setGroups(data);
    }).catch((cause: unknown) => {
      if (id !== generation.current.value) return;
      if (cause instanceof ApiError && cause.status === 401) expireSession();
      else setError(cause instanceof Error ? cause.message : 'Não foi possível carregar seus grupos.');
    }).finally(() => {
      if (id === generation.current.value) { setLoading(false); setRefreshing(false); }
    });
  }, [token, expireSession]);

  useEffect(() => {
    const counter = generation.current;
    void load();
    return () => { counter.value++; };
  }, [load]);
  function refresh() {
    setRefreshing(true);
    setError(null);
    void load();
  }
  const filtered = groups.filter(group => normalize(`${group.name} ${group.description ?? ''}`).includes(normalize(query.trim())));

  return <SafeAreaView style={ui.screen}>
    <FlatList data={loading ? [] : filtered} keyExtractor={item => item.id} keyboardShouldPersistTaps="handled"
      contentContainerStyle={[ui.content, { flexGrow: 1, gap: 16 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={palette.green} colors={[palette.green]} />}
      ListHeaderComponent={<View style={{ gap: 28, marginBottom: 8 }}>
        <View style={styles.topbar}><Brand /><Pressable accessibilityRole="button" onPress={signOut} style={styles.logout}><Text style={styles.logoutText}>Sair</Text></Pressable></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Ver meu perfil" onPress={() => router.push('/profile')} style={styles.welcome}>
          <View style={styles.avatar}><Text style={styles.initial}>{session?.profile.name.trim().charAt(0).toUpperCase()}</Text></View>
          <View style={{ flex: 1, gap: 3 }}><Text style={ui.eyebrow}>BOM TER VOCÊ NO TIME</Text><Text style={styles.greeting}>Olá, {session?.profile.name.trim().split(/\s+/)[0]}!</Text><Text style={styles.membership}>Meu perfil →</Text></View>
        </Pressable>
        <View style={styles.banner}><Text style={styles.bannerTitle}>A próxima pelada{'\n'}começa com a sua turma.</Text><Text style={styles.bannerBody}>Todos os seus grupos em um só lugar.</Text></View>
        <View style={{ gap: 16 }}>
          <View style={styles.heading}><Text style={ui.title}>Meus grupos</Text>{!loading && <View style={styles.count}><Text style={styles.countText}>{groups.length}</Text></View>}</View>
          <TextInput accessibilityLabel="Buscar nos meus grupos" style={ui.input} placeholder="Buscar um grupo…" placeholderTextColor={palette.muted} value={query} onChangeText={setQuery} autoCorrect={false} returnKeyType="search" />
        </View>
        {error && <View style={{ gap: 12 }}><Text accessibilityRole="alert" style={ui.error}>{error}</Text><Button onPress={refresh} loading={refreshing}>Tentar novamente</Button></View>}
      </View>}
      renderItem={({ item, index }) => <Pressable accessibilityRole="button" accessibilityLabel={`Abrir grupo ${item.name}`} onPress={() => router.push({ pathname: '/groups/[groupId]', params: { groupId: item.id } })} style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}>
        <View style={styles.cardHeader}><View style={[styles.groupIcon, index % 2 === 1 && { backgroundColor: '#EFF0D9' }]}><Text style={styles.groupInitial}>{item.name.trim().slice(0, 2).toUpperCase()}</Text></View><View style={styles.role}><Text style={styles.roleText}>{roles[item.role]}</Text></View></View>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={ui.body}>{item.description?.trim() || 'A turma está reunida. O próximo jogo espera por vocês.'}</Text>
        <View style={styles.cardFooter}><View style={styles.dot} /><Text style={styles.membership}>Acessar grupo →</Text></View>
      </Pressable>}
      ListEmptyComponent={loading ? <View style={styles.empty}><ActivityIndicator color={palette.green} size="large" /><Text style={ui.body}>Buscando seus grupos…</Text></View> : !error ? <View style={styles.empty}>
        <Text style={styles.emptyTitle}>{query.trim() ? 'Nenhum grupo encontrado' : 'Seu time ainda vai se reunir'}</Text>
        <Text style={[ui.body, { textAlign: 'center' }]}>{query.trim() ? 'Tente buscar por outro nome.' : 'Você ainda não participa de nenhum grupo. Peça ao organizador da sua pelada para adicionar você.'}</Text>
      </View> : null}
      ListFooterComponent={!loading && groups.length > 0 ? <Text style={styles.footer}>Futebol é sobre quem joga com você.</Text> : null}
    />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logout: { padding: 12, minHeight: 44 },
  logoutText: { color: palette.muted, fontWeight: '600', fontSize: 14 },
  welcome: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#E2EBDD', alignItems: 'center', justifyContent: 'center' },
  initial: { color: palette.green, fontWeight: '800', fontSize: 22 },
  greeting: { color: palette.ink, fontSize: 25, fontWeight: '700', letterSpacing: -0.5 },
  banner: { backgroundColor: palette.ink, borderRadius: 22, padding: 24, gap: 12 },
  bannerTitle: { fontSize: 25, lineHeight: 32, fontWeight: '700', color: palette.lime, letterSpacing: -0.5 },
  bannerBody: { color: '#CFDCD4', fontSize: 14 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  count: { backgroundColor: '#E1EBDD', borderRadius: 12, paddingHorizontal: 11, paddingVertical: 5 },
  countText: { color: palette.green, fontWeight: '800', fontSize: 14 },
  card: { borderWidth: 1, borderColor: palette.border, backgroundColor: palette.paper, borderRadius: 20, padding: 22, gap: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  groupIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#E5EFE5', alignItems: 'center', justifyContent: 'center' },
  groupInitial: { color: palette.green, fontWeight: '800', fontSize: 17 },
  role: { backgroundColor: '#F0F4EF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  roleText: { color: palette.green, fontSize: 12, fontWeight: '600' },
  groupName: { color: palette.ink, fontSize: 21, fontWeight: '700', letterSpacing: -0.4 },
  cardFooter: { borderTopWidth: 1, borderTopColor: '#EDF0EB', paddingTop: 14, marginTop: 5, flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.green },
  membership: { color: palette.muted, fontSize: 12 },
  empty: { paddingVertical: 36, paddingHorizontal: 16, alignItems: 'center', gap: 14 },
  emptyTitle: { color: palette.ink, fontWeight: '700', fontSize: 20, textAlign: 'center' },
  footer: { textAlign: 'center', paddingVertical: 18, color: palette.muted, fontSize: 12 },
});
