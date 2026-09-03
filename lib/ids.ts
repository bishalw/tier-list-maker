/**
 * Collision-free identifiers for locally created tiers and items.
 *
 * `Date.now()` alone repeats within a millisecond, which produced duplicate
 * tier ids on a double click and broke React keys, drag-and-drop droppable ids,
 * and every id-based store mutation.
 */

let fallbackCounter = 0;

function randomSuffix() {
  const cryptoRef = globalThis.crypto;

  if (typeof cryptoRef?.randomUUID === 'function') {
    return cryptoRef.randomUUID();
  }

  fallbackCounter += 1;
  return [
    Date.now().toString(36),
    fallbackCounter.toString(36),
    Math.random().toString(36).slice(2, 10),
  ].join('-');
}

export function createTierId() {
  return `tier-${randomSuffix()}`;
}

export function createItemId() {
  return `item-${randomSuffix()}`;
}
