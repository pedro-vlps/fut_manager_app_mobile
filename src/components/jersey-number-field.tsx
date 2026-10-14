import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Button, palette, ui } from '@/components/fut-ui';
import { validJerseyNumber } from '@/services/jersey-numbers';

export function JerseyNumberField({ name, number, busy, submit }: {
  name: string; number?: number | null; busy: boolean;
  submit: (number: number | null) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const valid = validJerseyNumber(value);
  const parsed = value === '' ? null : Number(value);
  async function save() {
    if (!valid || busy) return;
    if (await submit(parsed)) setOpen(false);
  }
  return <View style={{ gap: 8 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Editar número da camisa de ${name}`} accessibilityState={{ disabled: busy, expanded: open }} disabled={busy}
      onPress={() => { setValue(number == null ? '' : String(number)); setOpen(!open); }} style={{ paddingVertical: 12, opacity: busy ? 0.55 : 1 }}>
      <Text style={{ color: palette.green, fontWeight: '600' }}>{number == null ? 'Adicionar número da camisa' : `Camisa ${number} · editar`}</Text>
    </Pressable>
    {open && <>
      <Text style={ui.body}>Número da camisa (0 a 100). Deixe vazio para remover.</Text>
      <TextInput accessibilityLabel={`Número da camisa de ${name}`} style={ui.input} placeholder="Sem número" placeholderTextColor={palette.muted}
        keyboardType="number-pad" value={value} onChangeText={setValue} editable={!busy} />
      {!valid && <Text accessibilityRole="alert" style={ui.error}>Informe um número inteiro de 0 a 100.</Text>}
      <Button loading={busy} disabled={!valid || parsed === (number ?? null)} onPress={() => void save()}>Salvar número</Button>
      <Button disabled={busy} onPress={() => setOpen(false)}>Cancelar</Button>
    </>}
  </View>;
}
