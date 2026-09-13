import { createClient } from '@/lib/supabase/client';

/**
 * Performs a fail-safe, thorough user signout:
 * 1. Calls the server-side signout endpoint to expire SSR cookies
 * 2. Calls the client Supabase auth.signOut()
 * 3. Clears browser localStorage / sessionStorage auth items
 * 4. Hard navigates to the target URL (default: '/')
 */
export async function performSignOut(targetUrl: string = '/'): Promise<void> {
  try {
    // 1. Invalidate server session and remove HTTP cookies
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (apiErr) {
      console.warn('Server signout endpoint warning:', apiErr);
    }

    // 2. Client-side Supabase signOut
    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut({ scope: 'local' });
        await supabase.auth.signOut();
      }
    } catch (clientErr) {
      console.warn('Client Supabase signOut warning:', clientErr);
    }

    // 3. Purge all Supabase local / session storage keys in browser
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('sb-') || k.includes('supabase') || k.includes('auth-token') || k.includes('whatsbill'))) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        sessionStorage.clear();
      } catch (storageErr) {
        console.warn('Storage purge error:', storageErr);
      }

      // 4. Clear document cookies accessible to JavaScript
      try {
        document.cookie.split(';').forEach((c) => {
          const cookieName = c.split('=')[0].trim();
          if (cookieName.startsWith('sb-') || cookieName.includes('supabase') || cookieName.includes('auth-token')) {
            document.cookie = `${cookieName}=; Max-Age=0; path=/;`;
          }
        });
      } catch (cookieErr) {
        console.warn('Client cookie purge error:', cookieErr);
      }

      // 5. Hard redirect to target URL
      window.location.href = targetUrl;
    }
  } catch (err) {
    console.error('Signout exception, performing fallback redirect:', err);
    if (typeof window !== 'undefined') {
      window.location.href = targetUrl;
    }
  }
}
