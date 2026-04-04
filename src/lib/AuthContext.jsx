import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,            setUser]            = useState(null);
  const [profile,         setProfile]         = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadProfile = async (authUser) => {
    if (!authUser) { setProfile(null); return; }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();
    setProfile(data);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      setIsAuthenticated(!!u);
      loadProfile(u).finally(() => setLoading(false));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setIsAuthenticated(!!u);
      loadProfile(u);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  /**
   * Extended signUp: accepts all registration fields.
   * Extra fields are stored in raw_user_meta_data so the DB trigger
   * can populate the profiles row on creation.
   */
  const signUp = async ({ email, password, name, apellido1, apellido2, username, university, studyYear }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          apellido1,
          apellido2,
          username,
          university,
          study_year: studyYear,
        },
      },
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (changes) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
    return data;
  };

  /** Refresh profile from DB (e.g. after Stripe payment updates subscription_status) */
  const refreshProfile = async () => {
    if (!user) return;
    await loadProfile(user);
  };

  const displayName = profile?.name || user?.email?.split('@')[0] || 'Usuario';
  // Read subscription_status from app_metadata (set server-side, not editable by user)
  // Falls back to profile column if available (after schema migration)
  const subStatus = user?.app_metadata?.subscription_status ?? profile?.subscription_status;
  const isSubscribed = ['active', 'free'].includes(subStatus);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      displayName,
      isAuthenticated,
      isSubscribed,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
