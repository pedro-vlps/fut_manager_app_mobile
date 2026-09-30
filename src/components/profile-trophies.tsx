import { router } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Button, palette, ui } from '@/components/fut-ui';
import { gs } from '@/components/group-screen';
import { TrophyIcon } from '@/components/trophy-icon';
import { TrophyCollection } from '@/services/trophies';

export function ProfileTrophies({ data, loading, error, refresh }: {
  data?: TrophyCollection; loading: boolean; error?: string; refresh: () => void;
}) {
  return <View style={gs.card}>
    <View style={gs.row}><Text style={gs.heading}>Meus troféus</Text><Text style={gs.badge}>{data?.total ?? 0} conquistados</Text></View>
    {loading ? <ActivityIndicator color={palette.green} /> : error ? <><Text style={ui.error}>{error}</Text><Button onPress={refresh}>Tentar novamente</Button></> : <>
      {data?.total === 0 && <Text style={ui.body}>Sua coleção começa ao terminar uma temporada no topo de um ranking. Empatados em primeiro lugar também ganham!</Text>}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {data?.summary.map(item => <Pressable key={item.category} accessibilityRole="button" accessibilityLabel={`${item.name}: ${item.count} troféu(s). Ver lista completa`} onPress={() => router.push('/trophies')} style={{ alignItems: 'center', padding: 9, borderRadius: 16, backgroundColor: '#EFF4F8', minWidth: 78 }}>
          <TrophyIcon category={item.category} /><Text style={{ color: palette.ink, fontWeight: '800', fontSize: 16 }}>×{item.count}</Text>
        </Pressable>)}
      </View>
      <Pressable accessibilityRole="button" onPress={() => router.push('/trophies')} style={gs.back}><Text style={gs.link}>Ver todos os troféus →</Text></Pressable>
    </>}
  </View>;
}
