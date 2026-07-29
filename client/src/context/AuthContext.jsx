import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase, deepCamelCase } from '../lib/supabase';

const AuthContext = createContext(null);

// Priority order used to pick the single `role` column (drives RLS) when a
// user selects more than one role — highest-priority selected role wins.
const ROLE_PRIORITY = ['community_leader', 'sponsor', 'volunteer', 'beneficiary'];

function pickPrimaryRole(roles) {
  return ROLE_PRIORITY.find((r) => roles.includes(r)) || roles[0] || 'beneficiary';
}

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
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  const isRegistering                     = useRef(false);

  useEffect(() => {
    // onAuthStateChange fires immediately with the current session on subscribe,
    // so this single listener handles both the initial load and later sign-ins —
    // deliberately NOT paired with a separate getSession() bootstrap, which used
    // to race this listener and could resolve first with a stale "logged out"
    // read right after an OAuth redirect, bouncing the user back to /login.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (isRegistering.current) return;

        if (event === 'SIGNED_OUT' || !session?.user) {
          setSupabaseUser(null);
          setDbUser(null);
          setNeedsProfileCompletion(false);
          setLoading(false);
          return;
        }

        setSupabaseUser(session.user);
        const profile = await fetchProfile(session.user.id);
        if (profile) {
          setDbUser(profile);
          setNeedsProfileCompletion(false);
        } else {
          const pendingRaw = localStorage.getItem('rivers_google_signup');
          if (pendingRaw) {
            localStorage.removeItem('rivers_google_signup');
            await createProfileFromGoogleSignup(session.user, JSON.parse(pendingRaw));
            setDbUser(await fetchProfile(session.user.id));
            setNeedsProfileCompletion(false);
          } else {
            // Reached via "Sign in with Google" with no role selection made
            // (e.g. a brand-new user on the Login page) — let them choose
            // their role(s) instead of silently defaulting to beneficiary.
            setNeedsProfileCompletion(true);
          }
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function createProfileFromGoogleSignup(user, pending) {
    const roles = pending.roles?.length ? pending.roles : ['beneficiary'];
    await supabase.from('users').insert({
      id:           user.id,
      email:        user.email,
      full_name:    pending.fullName || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      role:         pickPrimaryRole(roles),
      roles,
      organisation: pending.organisation || '',
      community:    pending.community    || '',
      phone:        pending.phone        || '',
    });
  }

  // Used when a brand-new user signs in via Google with no prior role
  // selection (see needsProfileCompletion above) to finish creating their row.
  const completeGoogleProfile = async ({ roles, fullName, organisation, community, phone }) => {
    if (!supabaseUser) throw new Error('No authenticated session.');
    const finalRoles = roles?.length ? roles : ['beneficiary'];
    await supabase.from('users').insert({
      id:           supabaseUser.id,
      email:        supabaseUser.email,
      full_name:    fullName || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
      role:         pickPrimaryRole(finalRoles),
      roles:        finalRoles,
      organisation: organisation || '',
      community:    community    || '',
      phone:        phone        || '',
    });
    setDbUser(await fetchProfile(supabaseUser.id));
    setNeedsProfileCompletion(false);
  };

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
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });

  const registerWithGoogle = ({ roles, organisation, community, phone, fullName }) => {
    localStorage.setItem('rivers_google_signup', JSON.stringify({ roles, organisation, community, phone, fullName }));
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  };

  const register = async ({ email, password, fullName, roles, organisation, community, phone }) => {
    isRegistering.current = true;
    try {
      const primaryRole = pickPrimaryRole(roles);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: primaryRole, organisation, community, phone },
        },
      });
      if (error) throw error;

      // Insert profile immediately (the DB trigger also fires, but this is faster)
      await supabase.from('users').insert({
        id:           data.user.id,
        email,
        full_name:    fullName,
        role:         primaryRole,
        roles,
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
    setDbUser(null);
    setSupabaseUser(null);
    setNeedsProfileCompletion(false);
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

  const effectiveRole = dbUser?.role;

  return (
    <AuthContext.Provider value={{
      supabaseUser,
      user: dbUser,
      loading,
      needsProfileCompletion,
      effectiveRole,
      login,
      loginWithGoogle,
      registerWithGoogle,
      completeGoogleProfile,
      register,
      logout,
      resetPassword,
      refreshProfile,
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
