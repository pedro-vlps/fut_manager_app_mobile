import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Button, ui } from '@/components/fut-ui';
import { gs } from '@/components/group-screen';
import { Dropdown } from '@/components/dropdown';
import { Event, eventDate } from '@/services/groups';
import { RegistrationOpeningValues, registrationOpeningPayload, registrationOpeningValues, weekdayOptions } from '@/services/event-time';

export function RegistrationOpeningFields({ value, onChange, scheduled, zone, closesAt, busy }: {
  value: RegistrationOpeningValues; onChange: (value: RegistrationOpeningValues) => void;
  scheduled: Date | null; zone: string; closesAt?: string | null; busy: boolean;
}) {
  let preview: string | null = null;
  try { preview = registrationOpeningPayload(value, scheduled, zone, closesAt).registration_opens_at; } catch { /* Campos ainda incompletos. */ }
  return <View style={{ gap: 12 }}>
    <Dropdown label="Quando as confirmações abrem?" value={value.mode} disabled={busy}
      options={[{ value: 'immediate', label: 'Imediatamente' }, { value: 'weekday', label: 'Dia da semana + hora' }, { value: 'date', label: 'Data + hora' }]}
      onChange={mode => onChange({ ...value, mode: mode as RegistrationOpeningValues['mode'] })} />
    {value.mode === 'weekday' && <>
      <Dropdown label="Dia da semana da abertura" placeholder="Selecione o dia" value={value.weekday} disabled={busy} options={weekdayOptions}
        onChange={weekday => onChange({ ...value, weekday })} />
      <Text style={gs.muted}>Usa o último dia escolhido antes do prazo de confirmação deste evento. Confira a data abaixo.</Text>
    </>}
    {value.mode === 'date' && <>
      <Text style={ui.eyebrow}>DATA DE ABERTURA · DD/MM/AAAA</Text>
      <TextInput accessibilityLabel="Data de abertura das confirmações" placeholder="14/10/2026" style={ui.input} value={value.date} keyboardType="number-pad" maxLength={10} editable={!busy}
        onChangeText={text => { const digits = text.replace(/\D/g, '').slice(0, 8); onChange({ ...value, date: digits.replace(/^(\d{2})(\d)/, '$1/$2').replace(/^(\d{2}\/\d{2})(\d)/, '$1/$2') }); }} />
    </>}
    {value.mode !== 'immediate' && <>
      <Text style={ui.eyebrow}>HORÁRIO DE ABERTURA · HH:MM</Text>
      <TextInput accessibilityLabel="Horário de abertura das confirmações" placeholder="21:00" style={ui.input} value={value.time} keyboardType="number-pad" maxLength={5} editable={!busy}
        onChangeText={text => onChange({ ...value, time: text.replace(/\D/g, '').slice(0, 4).replace(/^(\d{2})(\d)/, '$1:$2') })} />
    </>}
    {preview && <Text style={ui.body}>Confirmações a partir de {eventDate(preview, zone)}. Fuso: {zone}.</Text>}
  </View>;
}

export function RegistrationOpeningForm({ event, busy, submit }: { event: Event; busy: boolean; submit: (body: unknown) => Promise<boolean> }) {
  const zone = event.schedule_timezone ?? 'America/Sao_Paulo';
  const [value, setValue] = useState(() => registrationOpeningValues(event.registration_opens_at, zone));
  const [error, setError] = useState('');
  async function save() {
    try { const body = registrationOpeningPayload(value, new Date(event.scheduled_at), zone, event.registration_closes_at); setError(''); await submit(body); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Revise o horário de abertura.'); }
  }
  return <View style={gs.card}>
    <Text style={gs.heading}>Abertura das confirmações</Text>
    <RegistrationOpeningFields value={value} onChange={setValue} scheduled={new Date(event.scheduled_at)} zone={zone} closesAt={event.registration_closes_at} busy={busy} />
    <Text style={gs.muted}>Antes desse horário, ninguém poderá confirmar presença. {event.recurring_weekly ? 'A abertura será mantida no mesmo dia e horário nas semanas seguintes.' : ''}</Text>
    {error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
    <Button loading={busy} onPress={() => void save()}>Salvar abertura das confirmações</Button>
  </View>;
}

export function RegistrationWindowInfo({ event }: { event: Event }) {
  const zone = event.schedule_timezone ?? 'America/Sao_Paulo';
  return <View style={{ gap: 4 }}>
    {event.registration_opens_at && <Text style={ui.body}>Confirmações a partir de {eventDate(event.registration_opens_at, zone)}.</Text>}
    <Text style={gs.muted}>Prazo para confirmar: {eventDate(event.registration_closes_at ?? event.scheduled_at, zone)}.</Text>
  </View>;
}
