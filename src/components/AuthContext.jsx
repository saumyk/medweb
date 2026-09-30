/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const AuthContext = createContext({
  user: null,
  loading: true,
  loginWithGoogle: async () => {},
  loginWithPassword: async () => {},
  signUpWithPassword: async () => {},
  sendPasswordReset: async () => {},
  updatePassword: async () => {},
  logout: async () => {},
  isSupabaseConfigured: false,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!supabase);
  const isSupabaseConfigured = !!supabase;

  useEffect(() => {
    if (!supabase) return;

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    if (!supabase) {
      alert("Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.");
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error logging in with Google:', error.message);
      alert(`Login error: ${error.message}`);
    }
  };

  const loginWithPassword = async (email, password) => {
    if (!supabase) {
      return { error: new Error('Supabase is not configured yet.') };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signUpWithPassword = async (email, password) => {
    if (!supabase) {
      return { error: new Error('Supabase is not configured yet.') };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    return { data, error };
  };

  const sendPasswordReset = async (email) => {
    if (!supabase) {
      return { error: new Error('Supabase is not configured yet.') };
    }

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  };

  const updatePassword = async (password) => {
    if (!supabase) {
      return { error: new Error('Supabase is not configured yet.') };
    }

    const { data, error } = await supabase.auth.updateUser({ password });
    return { data, error };
  };

  const logout = async () => {
    if (!supabase) return;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error logging out:', error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithPassword, signUpWithPassword, sendPasswordReset, updatePassword, logout, isSupabaseConfigured }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
