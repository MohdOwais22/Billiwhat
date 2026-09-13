import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseEnv } from '@/lib/supabase/config';
import { isMasterAdmin } from '@/lib/auth/masterAdmin';

export async function GET(req: NextRequest) {
  try {
    const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseEnv();

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ isAdmin: false, isAuthenticated: false });
    }

    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    let token: string | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {},
      },
    });

    let user = null;
    if (token) {
      const { data: tokenAuth } = await supabase.auth.getUser(token);
      user = tokenAuth?.user || null;
    }

    if (!user) {
      const { data: cookieAuth } = await supabase.auth.getUser();
      user = cookieAuth?.user || null;
    }

    if (!user) {
      return NextResponse.json({ isAdmin: false, isAuthenticated: false });
    }

    const isAdmin = isMasterAdmin(user);

    return NextResponse.json({
      isAdmin,
      isAuthenticated: true,
      userId: user.id,
    });
  } catch (err) {
    console.error('Error checking admin status:', err);
    return NextResponse.json({ isAdmin: false, isAuthenticated: false });
  }
}
