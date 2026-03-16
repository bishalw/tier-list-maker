import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareSupabaseClient } from './lib/supabase/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  const supabase = createMiddlewareSupabaseClient(request, response);
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
