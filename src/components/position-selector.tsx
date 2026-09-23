import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, palette, ui } from '@/components/fut-ui';
import { request } from '@/services/api';

export type Positions = Record<string, string[]>;
export type Catalog = Record<string, { label: string; positions: Record<string, string> }>;

export function PositionSelector({ value, onChange, disabled }: { value: Positions; onChange: (value: Positions) => void; disabled: boolean }) {
  const [catalog, setCatalog] = useState<Catalog>();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    request<Catalog>('/auth/modalities').then(data => { if (active) setCatalog(data); })
      .catch(() => { if (active) setError('Não foi possível carregar as posições.'); });
    return () => { active = false; };
  }, [attempt]);
  function toggle(sport: string, position: string) {
    const selected = value[sport] ?? [];
    const next = selected.includes(position) ? selected.filter(p => p !== position) : [...selected, position];
    const updated = { ...value, [sport]: next };
    if (!next.length) delete updated[sport];
    onChange(updated);
  }
  return <View style={{ gap: 18 }}>
    <Text style={ui.title}>Onde você joga?</Text>
    <Text style={ui.body}>Marque uma ou mais posições em cada modalidade que joga. Mantenha pelo menos uma posição selecionada.</Text>
    {!catalog && !error && <Text style={ui.body}>Carregando posições…</Text>}
    {error && <><Text style={ui.error}>{error}</Text><Button disabled={disabled} onPress={() => { setError(''); setAttempt(n => n + 1); }}>Tentar novamente</Button></>}
    {catalog && Object.entries(catalog).map(([sport, modality]) => <View key={sport} style={{ gap: 10 }}>
      <Text style={{ fontWeight: '700', color: palette.ink, fontSize: 18 }}>{modality.label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {Object.entries(modality.positions).map(([position, label]) => {
          const checked = value[sport]?.includes(position) ?? false;
          return <Pressable key={position} accessibilityRole="checkbox" accessibilityLabel={`${modality.label}: ${label}`}
            accessibilityState={{ checked, disabled }} disabled={disabled} onPress={() => toggle(sport, position)}
            style={{ borderWidth: 1, borderColor: checked ? palette.green : palette.border, backgroundColor: checked ? palette.green : palette.paper, padding: 13, borderRadius: 14 }}>
            <Text style={{ color: checked ? '#FFFFFF' : palette.ink }}>{checked ? '✓ ' : ''}{label}</Text>
          </Pressable>;
        })}
      </View>
    </View>)}
  </View>;
}
