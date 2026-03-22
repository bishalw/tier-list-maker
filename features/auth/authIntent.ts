'use client';

import type { ReadonlyURLSearchParams } from 'next/navigation';

export type AuthIntentType = 'share' | 'submit-remix';

export interface AuthIntent {
  type: AuthIntentType;
  next: string;
  listId: string | null;
  remixingId: string | null;
  createdAt: number;
  expiresAt: number;
}

const AUTH_INTENT_STORAGE_KEY = 'tier-list-auth-intent';
const AUTH_INTENT_TTL_MS = 15 * 60 * 1000;

function isValidNext(next: unknown): next is string {
  return (
    typeof next === 'string' &&
    next.startsWith('/') &&
    !next.startsWith('//') &&
    !next.includes('://')
  );
}

function parseIntent(raw: string | null): AuthIntent | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthIntent>;
    if (
      (parsed.type !== 'share' && parsed.type !== 'submit-remix') ||
      !isValidNext(parsed.next) ||
      typeof parsed.createdAt !== 'number' ||
      typeof parsed.expiresAt !== 'number'
    ) {
      return null;
    }

    if (parsed.expiresAt <= Date.now()) {
      return null;
    }

    return {
      type: parsed.type,
      next: parsed.next,
      listId: parsed.listId ?? null,
      remixingId: parsed.remixingId ?? null,
      createdAt: parsed.createdAt,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

function hasWindow() {
  return typeof window !== 'undefined';
}

export function clearAuthIntent() {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.removeItem(AUTH_INTENT_STORAGE_KEY);
}

export function readAuthIntent() {
  if (!hasWindow()) {
    return null;
  }

  const parsed = parseIntent(window.localStorage.getItem(AUTH_INTENT_STORAGE_KEY));
  if (!parsed) {
    clearAuthIntent();
    return null;
  }

  return parsed;
}

export function saveAuthIntent(input: {
  type: AuthIntentType;
  next: string;
  listId: string | null;
  remixingId: string | null;
}) {
  if (!hasWindow() || !isValidNext(input.next)) {
    return;
  }

  const now = Date.now();
  const intent: AuthIntent = {
    ...input,
    createdAt: now,
    expiresAt: now + AUTH_INTENT_TTL_MS,
  };

  window.localStorage.setItem(AUTH_INTENT_STORAGE_KEY, JSON.stringify(intent));
}

export function consumeAuthIntent() {
  const intent = readAuthIntent();
  clearAuthIntent();
  return intent;
}

export function buildInternalNext(
  pathname: string,
  searchParams: URLSearchParams | ReadonlyURLSearchParams
) {
  const nextParams = new URLSearchParams(searchParams.toString());
  nextParams.delete('auth');
  nextParams.delete('error');
  const query = nextParams.toString();

  return query ? `${pathname}?${query}` : pathname;
}

export { AUTH_INTENT_STORAGE_KEY, AUTH_INTENT_TTL_MS };
