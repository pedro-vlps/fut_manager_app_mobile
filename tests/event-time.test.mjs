import assert from 'node:assert/strict';
import test from 'node:test';
import { nextWeeklyEventDate, parseEventDate, previousWeeklyEventDate, registrationOpeningPayload, registrationOpeningValues } from '../src/services/event-time.ts';

const zone = 'America/Sao_Paulo';

test('seleciona o próximo sábado no horário local do evento', () => {
  assert.equal(nextWeeklyEventDate(6, '09:00', zone, new Date('2026-09-29T15:00:00Z')).toISOString(), '2026-10-03T12:00:00.000Z');
});

test('permite hoje quando há pelo menos uma hora de antecedência', () => {
  assert.equal(nextWeeklyEventDate(2, '15', zone, new Date('2026-09-29T15:00:00Z')).toISOString(), '2026-09-29T18:00:00.000Z');
});

test('horário passado ou próximo demais fica para a semana seguinte', () => {
  for (const time of ['11:00', '12:30']) {
    const result = nextWeeklyEventDate(2, time, zone, new Date('2026-09-29T15:00:00Z'));
    assert.equal(result.toISOString().slice(0, 10), '2026-10-06');
  }
});

test('usa a data local mesmo quando o UTC já virou o dia', () => {
  assert.equal(nextWeeklyEventDate(1, '23:30', zone, new Date('2026-09-29T01:00:00Z')).toISOString(), '2026-09-29T02:30:00.000Z');
});

test('atravessa a virada do ano', () => {
  assert.equal(nextWeeklyEventDate(5, '19:30', zone, new Date('2026-12-31T15:00:00Z')).toISOString(), '2027-01-01T22:30:00.000Z');
});

test('respeita o fuso selecionado para o evento', () => {
  assert.equal(nextWeeklyEventDate(6, '09:00', 'America/Rio_Branco', new Date('2026-09-29T15:00:00Z')).toISOString(), '2026-10-03T14:00:00.000Z');
});

test('rejeita dia e horário inválidos', () => {
  const now = new Date('2026-09-29T15:00:00Z');
  for (const day of [-1, 7, 1.5, NaN]) assert.equal(nextWeeklyEventDate(day, '09:00', zone, now), null);
  for (const time of ['', '25:00', '09:60']) assert.equal(nextWeeklyEventDate(6, time, zone, now), null);
});

test('eventos avulsos continuam usando a data informada', () => {
  assert.equal(parseEventDate('15/10/2026', '19:30', zone).toISOString(), '2026-10-15T22:30:00.000Z');
  assert.equal(parseEventDate('31/02/2026', '19:30', zone), null);
});

test('abre na quarta às 21 antes do evento de domingo', () => {
  const scheduled = new Date('2026-10-18T13:00:00Z');
  const body = registrationOpeningPayload({ mode: 'weekday', weekday: '3', date: '', time: '21:00' }, scheduled, zone);
  assert.equal(body.registration_opens_at, '2026-10-15T00:00:00.000Z');
});

test('abertura por data e hora e abertura imediata', () => {
  const scheduled = new Date('2026-10-18T13:00:00Z');
  assert.equal(registrationOpeningPayload({ mode: 'date', weekday: '', date: '14/10/2026', time: '21' }, scheduled, zone).registration_opens_at, '2026-10-15T00:00:00.000Z');
  assert.equal(registrationOpeningPayload({ mode: 'immediate', weekday: '', date: '', time: '' }, scheduled, zone).registration_opens_at, null);
});

test('abertura usa o fuso do evento e a virada do ano', () => {
  assert.equal(previousWeeklyEventDate(3, '21:00', 'America/Rio_Branco', new Date('2027-01-03T15:00:00Z')).toISOString(), '2026-12-31T02:00:00.000Z');
});

test('mesmo dia só usa esta semana quando a abertura antecede o prazo', () => {
  const deadline = new Date('2026-10-14T23:00:00Z'); // quarta 20h em Brasília
  assert.equal(previousWeeklyEventDate(3, '19:00', zone, deadline).toISOString(), '2026-10-14T22:00:00.000Z');
  assert.equal(previousWeeklyEventDate(3, '20:00', zone, deadline).toISOString(), '2026-10-07T23:00:00.000Z');
});

test('abertura semanal antecede também o prazo final configurado', () => {
  const body = registrationOpeningPayload({ mode: 'weekday', weekday: '3', date: '', time: '21:00' }, new Date('2026-10-18T13:00:00Z'), zone, '2026-10-16T21:00:00Z');
  assert.equal(body.registration_opens_at, '2026-10-15T00:00:00.000Z');
});

test('rejeita abertura igual ou após o encerramento e entradas inválidas', () => {
  const scheduled = new Date('2026-10-18T13:00:00Z');
  for (const [date, time] of [['18/10/2026', '10:00'], ['19/10/2026', '09:00'], ['31/02/2026', '21'], ['14/10/2026', '25:00']]) {
    assert.throws(() => registrationOpeningPayload({ mode: 'date', weekday: '', date, time }, scheduled, zone));
  }
  assert.throws(() => registrationOpeningPayload({ mode: 'weekday', weekday: '', date: '', time: '21' }, scheduled, zone));
  assert.throws(() => registrationOpeningPayload({ mode: 'date', weekday: '', date: '14/10/2026', time: '21' }, scheduled, zone, '2026-10-14T22:00:00Z'));
});

test('reabre a edição sem converter o horário para o fuso do aparelho', () => {
  assert.deepEqual(registrationOpeningValues('2026-10-15T00:00:00Z', zone), { mode: 'date', weekday: '', date: '14/10/2026', time: '21:00' });
  assert.equal(registrationOpeningValues(null, zone).mode, 'immediate');
});
