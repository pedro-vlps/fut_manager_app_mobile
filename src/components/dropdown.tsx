import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { palette, ui } from '@/components/fut-ui';

export function Dropdown({ label, placeholder = 'Selecione', value, options, disabled, onChange }: {
  label: string; placeholder?: string; value: string;
  options: { value: string; label: string }[]; disabled?: boolean; onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(option => option.value === value);
  return <View style={{ gap: 8 }}>
    <Text style={ui.body}>{label}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label} ${selected?.label ?? placeholder}`}
      accessibilityState={{ expanded: open && !disabled, disabled }} disabled={disabled}
      onPress={() => setOpen(!open)} style={[ui.input, { flexDirection: 'row', justifyContent: 'space-between', gap: 12, opacity: disabled ? 0.55 : 1 }]}>
      <Text style={{ color: selected ? palette.ink : palette.muted, flex: 1 }}>{selected?.label ?? placeholder}</Text>
      <Text style={{ color: palette.green }}>{open && !disabled ? '▴' : '▾'}</Text>
    </Pressable>
    {open && !disabled && <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled"
      style={{ maxHeight: 240, borderWidth: 1, borderColor: palette.border, borderRadius: 14, backgroundColor: palette.paper }}>
      {options.map(option => <Pressable key={option.value} accessibilityRole="button"
        accessibilityState={{ selected: value === option.value }}
        onPress={() => { onChange(option.value); setOpen(false); }}
        style={{ minHeight: 48, padding: 14, backgroundColor: value === option.value ? palette.lime : palette.paper }}>
        <Text style={{ color: palette.ink }}>{option.label}</Text>
      </Pressable>)}
      {!options.length && <Text style={[ui.body, { padding: 14 }]}>Nenhum jogador disponível.</Text>}
    </ScrollView>}
  </View>;
}
