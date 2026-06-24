import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase, deepCamelCase } from '../lib/supabase';

const DEMO_USERS = {
  admin:            { id: 'demo-admin',       fullName: 'Demo Admin',         email: 'admin@rivers.demo',       role: 'admin',            isVerified: true,  community: '', organisation: '' },
  community_leader: { id: 'demo-leader',      fullName: 'Marie Uwimana',      email: 'leader@rivers.demo',      role: 'community_leader', isVerified: true,  community: 'Bumbogo, Gasabo', organisation: '' },
  sponsor:          { id: 'demo-sponsor',     fullName: 'Amahoro Foundation', email: 'sponsor@rivers.demo',     role: 'sponsor',          isVerified: true,  community: '', organisation: 'Amahoro Foundation' },
  volunteer:        { id: 'demo-volunteer',   fullName: 'Diane Mukansanga',   email: 'vol@rivers.demo',         role: 'volunteer',        isVerified: false, community: '', organisation: '' },
  beneficiary:      { id: 'demo-beneficiary', fullName: 'Solange Iradukunda', email: 'beneficiary@rivers.demo', role: 'beneficiary',      isVerified: false, community: 'Gitega', organisation: '' },
};

const AuthContext = createContext(null);

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return deepCamelCase(data);
}

export function AuthProvider({ children }) {
  const [supabaseUser, setSupabaseUser]   = useState(null);
  const [dbUser,       setDbUser]         = useState(null);
  const [loading,      setLoading]        = useState(true);
  const [activeRole,   setActiveRole]     = useState(null);
  const isRegistering                     = useRef(false);

  useEffect(() => {
    // Demo mode — no Supabase needed
    const savedDemo = sessionStorage.getItem('rivers_demo_role');
    if (savedDemo && DEMO_USERS[savedDemo]) {
      setDbUser(DEMO_USERS[savedDemo]);
      setLoading(false);
      return;
    }

    // Bootstrap from existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user && !isRegistering.current) {
        setSupabaseUser(session.user);
        const profile = await fetchProfile(session.user.id);
        setDbUser(profile);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user && !isRegistering.current) {
          setSupabaseUser(session.user);

          if (event === 'SIGNED_IN') {
            // For Google OAuth new users: profile may need creating from localStorage
            const profile = await fetchProfile(session.user.id);
            if (!profile) {
              await createProfileFromGoogleSignup(session.user);
              setDbUser(await fetchProfile(session.user.id));
            } else {
              setDbUser(profile);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setSupabaseUser(null);
          setDbUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function createProfileFromGoogleSignup(user) {
    const pending = JSON.parse(localStorage.getItem('rivers_google_signup') || '{}');
    localStorage.removeItem('rivers_google_signup');

    await supabase.from('users').insert({
      id:           user.id,
      email:        user.email,
      full_name:    pending.fullName || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      role:         pending.role         || 'beneficiary',
      organisation: pending.organisation || '',
      community:    pending.community    || '',
      phone:        pending.phone        || '',
    });
  }

  // ── Auth methods ────────────────────────────────────────────

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const profile = await fetchProfile(data.user.id);
    setDbUser(profile);
    return profile;
  };

  const loginWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });

  const registerWithGoogle = ({ role, organisation, community, phone, fullName }) => {
    localStorage.setItem('rivers_google_signup', JSON.stringify({ role, organisation, community, phone, fullName }));
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  const register = async ({ email, password, fullName, role, organisation, community, phone }) => {
    isRegistering.current = true;
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role, organisation, community, phone },
        },
      });
      if (error) throw error;

      // Insert profile immediately (the DB trigger also fires, but this is faster)
      await supabase.from('users').insert({
        id:           data.user.id,
        email,
        full_name:    fullName,
        role,
        organisation: organisation || '',
        community:    community    || '',
        phone:        phone        || '',
      }).single();

      const profile = await fetchProfile(data.user.id);
      setSupabaseUser(data.user);
      setDbUser(profile);
      return profile;
    } finally {
      isRegistering.current = false;
    }
  };

  const logout = async () => {
    sessionStorage.removeItem('rivers_demo_role');
    setDbUser(null);
    setActiveRole(null);
    setSupabaseUser(null);
    await supabase.auth.signOut();
  };

  const resetPassword = (email) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

  const refreshProfile = async () => {
    if (!supabaseUser) return;
    const profile = await fetchProfile(supabaseUser.id);
    setDbUser(profile);
    return profile;
  };

  const enterDemo = (role) => {
    sessionStorage.setItem('rivers_demo_role', role);
    setDbUser(DEMO_USERS[role]);
    setSupabaseUser(null);
  };

  const switchRole = (role) => setActiveRole(role);
  const resetRole  = ()     => setActiveRole(null);
  const effectiveRole = activeRole ?? dbUser?.role;

  return (
    <AuthContext.Provider value={{
      supabaseUser,
      user: dbUser,
      loading,
      effectiveRole,
      switchRole,
      resetRole,
      login,
      loginWithGoogle,
      registerWithGoogle,
      register,
      logout,
      resetPassword,
      refreshProfile,
      enterDemo,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
