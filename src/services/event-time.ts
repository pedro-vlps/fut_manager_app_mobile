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
