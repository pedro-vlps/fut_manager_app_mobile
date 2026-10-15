import assert from 'node:assert/strict';
import test from 'node:test';
import { isMobileBrowser, responsiveLayout } from '../src/services/responsive-layout.ts';

test('celulares e tablets mantêm mobile, inclusive telas largas', () => {
  for (const browser of [
    { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile' },
    { userAgent: 'Mozilla/5.0 (Linux; Android 14; Tablet)' },
    { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Safari', platform: 'MacIntel', maxTouchPoints: 5 },
    { userAgent: 'Chrome', mobile: true },
  ]) {
    assert.equal(isMobileBrowser(browser), true);
    const layout = responsiveLayout(1366, isMobileBrowser(browser));
    assert.equal(layout.desktop, false);
    assert.equal(layout.columns, 1);
  }
});

test('desktop com tela touch não é confundido com tablet', () => {
  assert.equal(isMobileBrowser({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', platform: 'Win32', maxTouchPoints: 10 }), false);
});

test('desktop adapta colunas e navegação para vários tamanhos', () => {
  assert.equal(responsiveLayout(1920, false).columns, 3);
  assert.equal(responsiveLayout(1366, false).columns, 2);
  assert.equal(responsiveLayout(1024, false).compactSidebar, true);
  assert.equal(responsiveLayout(800, false).sidebar, false);
  assert.equal(responsiveLayout(390, false).columns, 1);
  assert.equal(responsiveLayout(390, false).desktop, true);
});

test('a escolha depende sempre do navegador, inclusive em telas largas ou estreitas', () => {
  assert.equal(responsiveLayout(1920, true).desktop, false);
  assert.equal(responsiveLayout(390, false).desktop, true);
});

test('modo desktop solicitado no navegador é reconhecido pelo user agent desktop', () => {
  const browser = { userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/130.0', platform: 'Linux x86_64', maxTouchPoints: 5, mobile: false };
  assert.equal(isMobileBrowser(browser), false);
  assert.equal(responsiveLayout(980, isMobileBrowser(browser)).desktop, true);
});
