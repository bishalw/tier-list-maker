export function getSafeNext(next: string | null | undefined) {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('://')) {
    return '/profile';
  }

  return next;
}

export function appendAuthComplete(next: string) {
  const [pathname, query = ''] = next.split('?');
  const params = new URLSearchParams(query);
  params.set('auth', 'complete');
  const nextQuery = params.toString();

  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}
