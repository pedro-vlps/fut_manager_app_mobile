// Domingo = 0, sábado = 6, sempre no fuso do evento.
export function nextWeeklyEventDate(weekday: number, time: string, zone: string, now = new Date()): Date | null {
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) return null;
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now).map(part => [part.type, part.value]));
  const day = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
  day.setUTCDate(day.getUTCDate() + (weekday - day.getUTCDay() + 7) % 7);
  const earliest = now.getTime() + 60 * 60 * 1000;
  for (let week = 0; week < 2; week++) {
    const date = `${String(day.getUTCDate()).padStart(2, '0')}/${String(day.getUTCMonth() + 1).padStart(2, '0')}/${day.getUTCFullYear()}`;
    const candidate = parseEventDate(date, time, zone);
    if (candidate && candidate.getTime() >= earliest) return candidate;
    day.setUTCDate(day.getUTCDate() + 7);
  }
  return null;
}

// Converte o horário do local do evento, sem usar o fuso implícito do aparelho.
export function parseEventDate(date: string, time: string, zone: string): Date | null {
  const d = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date);
  const t = /^(\d{1,2})(?::(\d{2}))?$/.exec(time);
  if (!d || !t) return null;
  const [, day, month, year] = d.map(Number);
  const hour = Number(t[1]), minute = Number(t[2] ?? 0);
  const wallTime = Date.UTC(year, month - 1, day, hour, minute);
  const check = new Date(wallTime);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day || hour > 23 || minute > 59) return null;
  const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  function displayedTime(value: number) {
    const parts = Object.fromEntries(formatter.formatToParts(value).map(p => [p.type, p.value]));
    return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
  }
  let instant = wallTime;
  for (let i = 0; i < 3; i++) instant += wallTime - displayedTime(instant);
  return displayedTime(instant) === wallTime ? new Date(instant) : null;
}

export const weekdayOptions = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado',
].map((label, day) => ({ value: String(day), label }));

export type RegistrationOpeningValues = { mode: 'immediate' | 'weekday' | 'date'; weekday: string; date: string; time: string };

export function registrationOpeningValues(current?: string | null, zone = 'America/Sao_Paulo'): RegistrationOpeningValues {
  if (!current) return { mode: 'immediate', weekday: '', date: '', time: '' };
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(current)).map(p => [p.type, p.value]));
  return { mode: 'date', weekday: '', date: `${parts.day}/${parts.month}/${parts.year}`, time: `${parts.hour}:${parts.minute}` };
}

// Última ocorrência do dia e horário escolhidos antes do prazo final, no fuso do evento.
export function previousWeeklyEventDate(weekday: number, time: string, zone: string, before: Date): Date | null {
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6 || !Number.isFinite(before.getTime())) return null;
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(before).map(p => [p.type, p.value]));
  const day = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
  day.setUTCDate(day.getUTCDate() - (day.getUTCDay() - weekday + 7) % 7);
  for (let week = 0; week < 2; week++) {
    const date = `${String(day.getUTCDate()).padStart(2, '0')}/${String(day.getUTCMonth() + 1).padStart(2, '0')}/${day.getUTCFullYear()}`;
    const candidate = parseEventDate(date, time, zone);
    if (candidate && candidate.getTime() < before.getTime()) return candidate;
    day.setUTCDate(day.getUTCDate() - 7);
  }
  return null;
}

export function registrationOpeningPayload(value: RegistrationOpeningValues, scheduled: Date | null, zone: string, closesAt?: string | null) {
  if (value.mode === 'immediate') return { registration_opens_at: null };
  if (!scheduled || !Number.isFinite(scheduled.getTime())) throw new Error('Defina uma data e um horário válidos para o evento.');
  const deadline = closesAt ? new Date(closesAt) : scheduled;
  if (value.mode === 'weekday' && value.weekday === '') throw new Error('Selecione o dia da semana em que as confirmações abrem.');
  const opening = value.mode === 'weekday'
    ? previousWeeklyEventDate(Number(value.weekday), value.time, zone, deadline)
    : parseEventDate(value.date, value.time, zone);
  if (!opening) throw new Error('Informe um dia ou data e um horário válidos para a abertura das confirmações.');
  if (opening >= deadline || opening >= scheduled) throw new Error('A abertura das confirmações deve ser antes do prazo final e do evento.');
  return { registration_opens_at: opening.toISOString() };
}
