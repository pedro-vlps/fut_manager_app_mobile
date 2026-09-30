import { Text, View } from 'react-native';
import { trophySymbols } from '@/services/trophies';

/** Taça desenhada com formas nativas, com acabamento de platina. */
export function TrophyIcon({ category }: { category: string }) {
  return <View accessible={false} style={{ width: 60, height: 64, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ position: 'absolute', top: 8, width: 54, height: 25, borderWidth: 4, borderColor: '#91AFC4', borderBottomLeftRadius: 18, borderBottomRightRadius: 18 }} />
    <View style={{ position: 'absolute', top: 4, width: 36, height: 35, borderWidth: 2, borderColor: '#91AFC4', backgroundColor: '#DCECF5', borderBottomLeftRadius: 19, borderBottomRightRadius: 19, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#385A72', fontSize: 18, fontWeight: '900' }}>{trophySymbols[category] ?? '★'}</Text>
    </View>
    <View style={{ position: 'absolute', top: 38, width: 7, height: 12, backgroundColor: '#91AFC4' }} />
    <View style={{ position: 'absolute', top: 49, width: 29, height: 5, borderRadius: 3, backgroundColor: '#B5CDDD' }} />
    <View style={{ position: 'absolute', top: 54, width: 38, height: 5, borderRadius: 2, backgroundColor: '#6F91AA' }} />
  </View>;
}
