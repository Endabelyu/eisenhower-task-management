import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://replace-me.supabase.co') {
  console.warn(
    'supabaseUrl or supabaseAnonKey is not set or using dummy values. ' +
    'Please set VITE_SUPABASE_ANON_KEY in your .env.local file.'
  );
}

export const supabase = createClient(
  supabaseUrl ,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      fetch: async (url, options) => {
        const response = await fetch(url, options);
        // Intercept 401 responses, but exclude auth endpoints to avoid loops if refresh fails
        if (response.status === 401 && typeof url === 'string' && !url.includes('/auth/v1/')) {
          console.warn('Caught 401 Unauthorized response globally. Forcing sign out.');
          
          // Dispatch a custom event so the React tree (AuthContext) can show a toast
          window.dispatchEvent(new CustomEvent('supabase-401'));
          
          // Force sign out to clean up local state and trigger ProtectedRoute redirect
          await supabase.auth.signOut();
        }
        return response;
      }
    }
  }
);
