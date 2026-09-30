import { useState } from 'react';
import { Switch, Text, TextInput, View } from 'react-native';
import { Button, ui } from '@/components/fut-ui';
import { gs } from '@/components/group-screen';
import { Event } from '@/services/groups';

export type ConfirmationValues = { separate: boolean; minimum: string; maximum: string; keeperMinimum: string; keeperMaximum: string };

export function confirmationValues(event?: Event): ConfirmationValues {
  return { separate: event ? event.min_confirmed_goalkeepers != null : true,
    minimum: String(event?.min_confirmed_players ?? 18), maximum: event ? event.max_confirmed_players == null ? '' : String(event.max_confirmed_players) : '18',
    keeperMinimum: String(event?.min_confirmed_goalkeepers ?? 2), keeperMaximum: event?.min_confirmed_goalkeepers != null ? event.max_confirmed_goalkeepers == null ? '' : String(event.max_confirmed_goalkeepers) : '2' };
}

export function confirmationPayload(value: ConfirmationValues) {
  const integer = (text: string, min: number, max: number) => /^\d+$/.test(text) && Number(text) >= min && Number(text) <= max;
  if (!integer(value.minimum, 3, 1000) || (value.maximum !== '' && (!integer(value.maximum, 3, 1000) || Number(value.maximum) < Number(value.minimum))))
    throw new Error('Informe um mínimo de 3 a 1000 jogadores e um limite de vagas igual ou maior. Deixe o limite vazio para não limitar.');
  if (value.separate && (!integer(value.keeperMinimum, 0, 4) || (value.keeperMaximum !== '' && (!integer(value.keeperMaximum, 0, 4) || Number(value.keeperMaximum) < Number(value.keeperMinimum)))))
    throw new Error('Informe de 0 a 4 goleiros. O limite deve ser igual ou maior que o mínimo.');
  return { min_confirmed_players: Number(value.minimum), max_confirmed_players: value.maximum === '' ? null : Number(value.maximum),
    min_confirmed_goalkeepers: value.separate ? Number(value.keeperMinimum) : null,
    max_confirmed_goalkeepers: value.separate && value.keeperMaximum !== '' ? Number(value.keeperMaximum) : null };
}

export function ConfirmationFields({ value, onChange, busy }: { value: ConfirmationValues; onChange: (next: ConfirmationValues) => void; busy: boolean }) {
  return <View style={{ gap: 12 }}>
    <View style={gs.row}><Text style={[gs.heading, { flex: 1 }]}>Separar vagas de goleiros</Text><Switch accessibilityLabel="Separar vagas de goleiros" value={value.separate} onValueChange={separate => onChange({ ...value, separate })} disabled={busy} /></View>
    {([
      ['minimum', value.separate ? 'Mínimo de jogadores de linha' : 'Mínimo de confirmados'],
      ['maximum', value.separate ? 'Limite de jogadores de linha' : 'Limite de confirmados'],
      ...(value.separate ? [['keeperMinimum', 'Mínimo de goleiros'], ['keeperMaximum', 'Limite de goleiros']] : []),
    ] as [Exclude<keyof ConfirmationValues, 'separate'>, string][]).map(([key, label]) => <View key={key} style={{ gap: 6 }}>
      <Text style={ui.eyebrow}>{label}</Text>
      <TextInput accessibilityLabel={label} style={ui.input} value={value[key]} onChangeText={text => onChange({ ...value, [key]: text })} keyboardType="number-pad" maxLength={4} editable={!busy} placeholder={key.toLowerCase().includes('maximum') ? 'Sem limite' : undefined} />
    </View>)}
    <Text style={gs.muted}>O mínimo libera o início do evento. O limite define as vagas; excedentes entram na lista de espera.</Text>
    {value.separate && <Text style={ui.body}>Com 2 goleiros confirmados, eles jogam todas as partidas. O goleiro do time que sai passa para o time que entra. Exemplo: 18 jogadores de linha formam 3 times de 6, mais 1 goleiro em cada time em campo.</Text>}
  </View>;
}

export function ConfirmationSettingsForm({ event, busy, submit }: { event: Event; busy: boolean; submit: (body: unknown) => Promise<boolean> }) {
  const [value, setValue] = useState(() => confirmationValues(event));
  const [error, setError] = useState('');
  async function save() {
    try { const body = confirmationPayload(value); setError(''); await submit(body); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Revise as vagas.'); }
  }
  return <View style={gs.card}>
    <Text style={gs.heading}>Confirmações e vagas</Text>
    <ConfirmationFields value={value} onChange={setValue} busy={busy} />
    <Text style={gs.muted}>Ao salvar, a lista de espera será atualizada e os times precisarão ser montados novamente.</Text>
    {error ? <Text accessibilityRole="alert" style={ui.error}>{error}</Text> : null}
    <Button loading={busy} onPress={() => void save()}>Salvar configuração de vagas</Button>
  </View>;
}
