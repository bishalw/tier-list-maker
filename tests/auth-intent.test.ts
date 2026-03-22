import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildInternalNext,
  clearAuthIntent,
  consumeAuthIntent,
  readAuthIntent,
  saveAuthIntent,
} from '../features/auth/authIntent';

class MemoryStorage {
  private data = new Map<string, string>();

  getItem(key: string) {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.data.set(key, value);
  }

  removeItem(key: string) {
    this.data.delete(key);
  }

  clear() {
    this.data.clear();
  }
}

const localStorage = new MemoryStorage();

Object.assign(globalThis, {
  localStorage,
  window: { localStorage },
});

test.beforeEach(() => {
  localStorage.clear();
  clearAuthIntent();
});

test('saveAuthIntent and consumeAuthIntent round-trip once', () => {
  saveAuthIntent({
    type: 'share',
    next: '/create?list=abc',
    listId: 'abc',
    remixingId: null,
  });

  assert.equal(readAuthIntent()?.type, 'share');
  assert.equal(consumeAuthIntent()?.type, 'share');
  assert.equal(readAuthIntent(), null);
});

test('readAuthIntent clears malformed payloads', () => {
  localStorage.setItem('tier-list-auth-intent', '{"type":"share","next":"https://bad.example"}');

  assert.equal(readAuthIntent(), null);
  assert.equal(localStorage.getItem('tier-list-auth-intent'), null);
});

test('buildInternalNext strips transient auth and error params', () => {
  const next = buildInternalNext('/create', new URLSearchParams('list=1&auth=complete&error=oauth'));
  assert.equal(next, '/create?list=1');
});
