import test from 'node:test';
import assert from 'node:assert/strict';
import { appendAuthComplete, getSafeNext } from '../features/auth/redirects';

test('getSafeNext falls back to profile for unsafe values', () => {
  assert.equal(getSafeNext('https://evil.example'), '/profile');
  assert.equal(getSafeNext('//evil.example'), '/profile');
  assert.equal(getSafeNext(null), '/profile');
});

test('getSafeNext preserves safe relative paths', () => {
  assert.equal(getSafeNext('/create?list=123'), '/create?list=123');
});

test('appendAuthComplete appends auth=complete to the next path', () => {
  assert.equal(appendAuthComplete('/create?list=123'), '/create?list=123&auth=complete');
  assert.equal(appendAuthComplete('/profile'), '/profile?auth=complete');
});
