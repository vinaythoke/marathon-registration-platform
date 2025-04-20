import { createBrowserClient } from '@supabase/ssr';
import { type Database } from '@/types/supabase';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return '';
          const cookie = document.cookie
            .split(';')
            .find((c) => c.trim().startsWith(`${name}=`));
          return cookie ? cookie.split('=')[1] : '';
        },
        set(name: string, value: string, options: { path?: string; maxAge?: number }) {
          if (typeof document === 'undefined') return;
          document.cookie = `${name}=${value}${options.path ? `;path=${options.path}` : ''}${
            options.maxAge ? `;max-age=${options.maxAge}` : ''
          }`;
        },
        remove(name: string, options: { path?: string }) {
          if (typeof document === 'undefined') return;
          document.cookie = `${name}=;max-age=0${options.path ? `;path=${options.path}` : ''}`;
        },
      },
    }
  );
} 