import { NextResponse, type NextRequest } from 'next/server';
import { appendAuthComplete, getSafeNext } from '@/features/auth/redirects';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = getSafeNext(url.searchParams.get('next'));

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=oauth_callback', request.url));
  }

  const response = NextResponse.redirect(new URL(appendAuthComplete(next), request.url));
  const supabase = createRouteHandlerSupabaseClient(request, response);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL('/login?error=oauth_callback', request.url));
  }

  return response;
}
