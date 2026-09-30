import { useRef, useState } from 'react';
import { Switch, Text, TextInput, View } from 'react-native';
import { Button, palette, ui } from '@/components/fut-ui';
import { gs } from '@/components/group-screen';
import { useAuth } from '@/contexts/auth';
import { ApiError, request } from '@/services/api';
import { Event, eventDate } from '@/services/groups';
import { Dropdown } from '@/components/dropdown';
import { nextWeeklyEventDate, parseEventDate } from '@/services/event-time';
import { operationId, modalityOptions } from '@/services/lifecycle';
import { ConfirmationFields, confirmationValues, confirmationPayload } from '@/components/confirmation-settings';

const weekdayOptions = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado',
].map((label, day) => ({ value: String(day), label }));

export function EventScheduler({ groupId }: { groupId: string }) {
  const { session, expireSession } = useAuth();
  const [modality, setModality] = useState('campo');
  const [title, setTitle] = useState('Pelada da semana');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [confirmations, setConfirmations] = useState(() => confirmationValues());
  const [recurring, setRecurring] = useState(false);
  const [weekday, setWeekday] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<Event | null>(null);
  const pending = useRef<{ signature: string; id: string } | null>(null);
  const working = useRef(false);
  const [zone, setZone] = useState('America/Sao_Paulo');
  const firstOccurrence = recurring && weekday !== '' ? nextWeeklyEventDate(Number(weekday), time, zone) : null;
  async function save() {
    if (!session || working.current) return;
    setError(''); setSaved(null);
    if (recurring && weekday === '') { setError('Selecione o dia da semana do evento.'); return; }
    const scheduled = recurring ? nextWeeklyEventDate(Number(weekday), time, zone) : parseEventDate(date, time, zone);
    if (!scheduled) { setError(recurring ? 'Informe um horário válido, como 15 ou 15:00.' : 'Informe uma data válida e um horário, como 15 ou 15:00.'); return; }
    if (!title.trim()) { setError('Informe o nome do evento.'); return; }
    let slots;
    try { slots = confirmationPayload(confirmations); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Revise as vagas.'); return; }
    const body = { modality, title: title.trim(), scheduled_at: scheduled.toISOString(), ...slots, recurring_weekly: recurring, schedule_timezone: zone };
    const signature = JSON.stringify(body);
    if (pending.current?.signature !== signature) pending.current = { signature, id: operationId() };
    working.current = true; setBusy(true);
    try {
      const event = await request<Event>(`/my-groups/${groupId}/schedule`, { method: 'POST', body: JSON.stringify({ ...body, id: pending.current.id }) }, session.access_token);
      setSaved(event); setDate(''); setTime(''); pending.current = null;
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) expireSession();
      else setError(cause instanceof Error ? cause.message : 'Não foi possível agendar.');
    } finally { working.current = false; setBusy(false); }
  }
  return <View style={gs.card}>
    <Text style={gs.heading}>Agendar evento</Text>
    <Text style={ui.body}>Defina quando será a próxima pelada e quantas confirmações serão necessárias para iniciar.</Text>
    <Dropdown label="Modalidade do evento" value={modality} onChange={setModality} options={modalityOptions} disabled={busy} />
    <Text style={ui.eyebrow}>NOME DO EVENTO</Text>
    <TextInput accessibilityLabel="Nome do evento" style={ui.input} value={title} onChangeText={setTitle} maxLength={150} editable={!busy} />
    <View style={gs.row}><Text style={[gs.heading, { flex: 1 }]}>Repetir toda semana</Text><Switch accessibilityLabel="Repetir toda semana" value={recurring} onValueChange={value => { setRecurring(value); setError(''); }} disabled={busy} trackColor={{ true: palette.green }} /></View>
    {recurring ? <Dropdown label="Dia da semana" placeholder="Selecione o dia da semana" value={weekday} onChange={value => { setWeekday(value); setError(''); }} options={weekdayOptions} disabled={busy} /> : <>
      <Text style={ui.eyebrow}>DATA · DD/MM/AAAA</Text>
      <TextInput accessibilityLabel="Data do evento" placeholder="27/09/2026" style={ui.input} value={date} keyboardType="number-pad" maxLength={10} editable={!busy} onChangeText={value => { const digits = value.replace(/\D/g, '').slice(0, 8); setDate(digits.replace(/^(\d{2})(\d)/, '$1/$2').replace(/^(\d{2}\/\d{2})(\d)/, '$1/$2')); }} />
    </>}
    <Text style={ui.eyebrow}>HORÁRIO · HH:MM</Text>
    <TextInput accessibilityLabel="Horário do evento" placeholder="19:30" style={ui.input} value={time} keyboardType="number-pad" maxLength={5} editable={!busy} onChangeText={value => setTime(value.replace(/\D/g, '').slice(0, 4).replace(/^(\d{2})(\d)/, '$1:$2'))} />
    <Dropdown label="Fuso horário do evento" value={zone} disabled={busy} onChange={value => { setZone(value); setError(''); }} options={[
      { value: 'America/Sao_Paulo', label: 'Brasília / São Paulo' },
      { value: 'America/Manaus', label: 'Manaus' },
      { value: 'America/Rio_Branco', label: 'Rio Branco' },
      { value: 'America/Noronha', label: 'Fernando de Noronha' },
    ]} />
    <Text style={gs.muted}>{recurring ? 'A primeira ocorrência será no próximo dia escolhido com pelo menos 1 hora de antecedência.' : 'Pode ser hoje, com pelo menos 1 hora de antecedência.'} Fuso horário: {zone}</Text>
    {firstOccurrence && <Text style={ui.body}>Primeiro evento: {eventDate(firstOccurrence.toISOString(), zone)}.</Text>}
    <ConfirmationFields value={confirmations} onChange={setConfirmations} busy={busy} />
    {recurring && <Text style={ui.body}>Ao encerrar o evento, outro será criado no mesmo dia e horário da semana seguinte. Os jogadores precisarão confirmar novamente.</Text>}
    {error ? <Text accessibilityRole="alert" style={ui.error}>{error}</Text> : null}
    {saved && <Text accessibilityRole="alert" style={gs.success}>{saved.title} agendado para {eventDate(saved.scheduled_at, zone)}. As inscrições estão abertas.</Text>}
    <Button onPress={() => void save()} loading={busy}>Agendar evento</Button>
  </View>;
}
