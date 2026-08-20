import './helpers/browserEnv';

import test from 'node:test';
import assert from 'node:assert/strict';
import { memoryStorage, seedPersistedState } from './helpers/browserEnv';
import { PREFS_STORAGE_KEY, prefsStore } from '../store/usePrefsStore';
import { DEFAULT_PREFS, sanitizePrefs } from '../store/prefsInvariants';
import { createDefaultTiers, getThemeDefaultBoardBackground } from '../constants/theme';
import { setPersistWritesEnabled } from '../store/persistStorage';

test.beforeEach(() => {
  memoryStorage.clear();
  setPersistWritesEnabled(true);
  prefsStore.setState({ ...DEFAULT_PREFS });
});

test('sanitizePrefs narrows every field back to a known value', () => {
  const sanitized = sanitizePrefs({
    theme: 'neon',
    boardBackground: 'javascript:alert(1)',
    itemSize: 'gigantic',
    imageFit: 'zoom',
  });

  assert.deepEqual(sanitized, DEFAULT_PREFS);
});

test('sanitizePrefs keeps recognisable colors', () => {
  assert.equal(sanitizePrefs({ boardBackground: '#1a2b3c' }).boardBackground, '#1a2b3c');
  assert.equal(
    sanitizePrefs({ boardBackground: 'rgba(10, 20, 30, 0.5)' }).boardBackground,
    'rgba(10, 20, 30, 0.5)'
  );
  assert.equal(sanitizePrefs({ boardBackground: 'theme-default' }).boardBackground, 'theme-default');
});

test('a corrupted persisted theme cannot reach the theme lookup', async () => {
  seedPersistedState(PREFS_STORAGE_KEY, {
    theme: 'neon',
    boardBackground: 'not-a-color',
    itemSize: 'gigantic',
    imageFit: 'zoom',
  });

  await prefsStore.persist.rehydrate();

  const { theme, boardBackground, itemSize, imageFit } = prefsStore.getState();
  assert.equal(theme, 'modern');
  assert.equal(boardBackground, 'theme-default');
  assert.equal(itemSize, 'medium');
  assert.equal(imageFit, 'cover');

  // These both threw on an unknown theme before the state was narrowed.
  assert.doesNotThrow(() => createDefaultTiers(theme));
  assert.doesNotThrow(() => getThemeDefaultBoardBackground(theme));
});

test('valid persisted preferences are preserved', async () => {
  seedPersistedState(PREFS_STORAGE_KEY, {
    theme: 'brutalist',
    boardBackground: '#abcdef',
    itemSize: 'large',
    imageFit: 'contain',
  });

  await prefsStore.persist.rehydrate();

  assert.equal(prefsStore.getState().theme, 'brutalist');
  assert.equal(prefsStore.getState().boardBackground, '#abcdef');
  assert.equal(prefsStore.getState().itemSize, 'large');
  assert.equal(prefsStore.getState().imageFit, 'contain');
});

test('setters reject values outside the allowed set', () => {
  prefsStore.getState().setTheme('neon' as never);
  prefsStore.getState().setItemSize('gigantic' as never);
  prefsStore.getState().setImageFit('zoom' as never);
  prefsStore.getState().setBoardBackground('url(https://example.com/x.png)');

  assert.deepEqual(
    {
      theme: prefsStore.getState().theme,
      itemSize: prefsStore.getState().itemSize,
      imageFit: prefsStore.getState().imageFit,
      boardBackground: prefsStore.getState().boardBackground,
    },
    DEFAULT_PREFS
  );
});
