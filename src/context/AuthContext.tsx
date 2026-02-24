import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  forceRefreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  forceRefreshSession: async () => {},
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const forceRefreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      setSession(data.session);
      setUser(data.user);
    } catch (error) {
      console.error('Failed to refresh session:', error);
      toast.error('Session expired. Please log in again.');
      await supabase.auth.signOut();
    }
  }, []);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);

      if (event === 'TOKEN_REFRESHED') {
        console.log('Authentication token successfully refreshed.');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Proactive refresh mechanism
  useEffect(() => {
    if (!session?.expires_at) return;

    // Convert expires_at (seconds since epoch) to milliseconds
    const expiresAtMs = session.expires_at * 1000;
    // We want to refresh 2 minutes before the token actually expires
    const refreshThresholdMs = 2 * 60 * 1000; 
    
    // Calculate how long until we hit the threshold
    const timeUntilRefresh = expiresAtMs - Date.now() - refreshThresholdMs;

    // If it's already past the threshold, refresh now
    if (timeUntilRefresh <= 0) {
      forceRefreshSession();
      return;
    }

    const timeoutId = setTimeout(() => {
      forceRefreshSession();
    }, timeUntilRefresh);

    return () => clearTimeout(timeoutId);
  }, [session, forceRefreshSession]);

  return (
    <AuthContext.Provider value={{ user, session, loading, forceRefreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};
