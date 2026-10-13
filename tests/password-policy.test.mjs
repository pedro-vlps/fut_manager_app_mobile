import assert from 'node:assert/strict';
import test from 'node:test';
import { passwordRequirements, validNewPassword } from '../src/services/password-policy.ts';

test('exige todos os critérios na mesma senha', () => {
  for (const password of ['Ab1!', 'abcdef1!', 'ABCDEF1!', 'Abcdefg!', 'Abcdef12']) {
    assert.equal(validNewPassword(password), false);
  }
  assert.equal(validNewPassword('Abcdef1!'), true);
  assert.equal(passwordRequirements('Abcdef12').find(item => item.id === 'special').satisfied, false);
});

test('espaço, quebra de linha e caracteres invisíveis não são caracteres especiais', () => {
  for (const password of ['Abcdef1 ', 'Abcdef1\n', 'Abcdef1\u200b']) {
    assert.equal(validNewPassword(password), false);
  }
});

test('aceita letras acentuadas e símbolos, com o mesmo comprimento Unicode da API', () => {
  assert.equal(validNewPassword('Ábcdef1!'), true);
  assert.equal(validNewPassword('Ábcdef1🔒'), true);
  assert.equal(validNewPassword('Ábcde1🔒'), false); // 7 caracteres, mesmo com símbolo fora do BMP.
});

test('mantém o limite de 128 caracteres', () => {
  assert.equal(validNewPassword('Aa1!' + 'a'.repeat(124)), true);
  assert.equal(validNewPassword('Aa1!' + 'a'.repeat(125)), false);
});
