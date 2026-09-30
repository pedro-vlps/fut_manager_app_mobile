import assert from 'node:assert/strict';
import test from 'node:test';
import { nextWeeklyEventDate, parseEventDate } from '../src/services/event-time.ts';

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
