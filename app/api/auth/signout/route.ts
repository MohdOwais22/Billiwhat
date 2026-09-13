import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseEnv } from '@/lib/supabase/config';

export async function POST(req: NextRequest) {
  try {
    const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseEnv();
    const cookieStore = await cookies();

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore
            }
          },
        },
      });
      await supabase.auth.signOut();
    }

    // Explicitly delete any lingering Supabase auth cookies
    const allCookies = cookieStore.getAll();
    for (const c of allCookies) {
      if (
        c.name.startsWith('sb-') ||
        c.name.includes('auth-token') ||
        c.name.includes('supabase') ||
        c.name.includes('session')
      ) {
        cookieStore.delete(c.name);
      }
    }

    return NextResponse.json({ success: true, message: 'Signed out successfully' });
  } catch (err: any) {
    console.error('Server signout error:', err);
    return NextResponse.json({ success: true, message: 'Signed out' });
  }
}
