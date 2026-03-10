import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  isSuperAdmin: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const checkSuperAdmin = useCallback(async (userId: string) => {
    try {
      await supabase.rpc('auto_assign_super_admin' as any);
      const { data } = await (supabase.from as any)('system_roles').select('role').eq('user_id', userId);
      setIsSuperAdmin((data as any[])?.some((r: any) => r.role === 'super_admin') || false);
    } catch {
      setIsSuperAdmin(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) await checkSuperAdmin(u.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) await checkSuperAdmin(u.id);
      else setIsSuperAdmin(false);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [checkSuperAdmin]);

  const login = useCallback(async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    return !error;
  }, []);

  const signup = useCallback(async (email: string, pass: string) => {
    const { error } = await supabase.auth.signUp({ email, password: pass });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setIsSuperAdmin(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, loading, isSuperAdmin, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
