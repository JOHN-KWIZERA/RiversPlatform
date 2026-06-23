import { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { authApi } from '../lib/api';

const DEMO_USERS = {
  admin: { _id: 'demo-admin', fullName: 'Demo Admin', email: 'admin@rivers.demo', role: 'admin', isVerified: true, community: '', organisation: '' },
  community_leader: { _id: 'demo-leader', fullName: 'Marie Uwimana', email: 'leader@rivers.demo', role: 'community_leader', isVerified: true, community: 'Bumbogo, Gasabo', organisation: '' },
  sponsor: { _id: 'demo-sponsor', fullName: 'Amahoro Foundation', email: 'sponsor@rivers.demo', role: 'sponsor', isVerified: true, community: '', organisation: 'Amahoro Foundation' },
  volunteer: { _id: 'demo-volunteer', fullName: 'Diane Mukansanga', email: 'vol@rivers.demo', role: 'volunteer', isVerified: false, community: '', organisation: '' },
  beneficiary: { _id: 'demo-beneficiary', fullName: 'Solange Iradukunda', email: 'beneficiary@rivers.demo', role: 'beneficiary', isVerified: false, community: 'Gitega', organisation: '' },
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState(null); // null = use DB role
  // Prevents onAuthStateChanged from calling /me during active registration,
  // which would auto-create the user with the wrong default role before
  // authApi.register() has a chance to run.
  const isRegistering = useRef(false);

  useEffect(() => {
    // Demo mode — no Firebase needed
    const savedDemo = sessionStorage.getItem('rivers_demo_role');
    if (savedDemo && DEMO_USERS[savedDemo]) {
      setDbUser(DEMO_USERS[savedDemo]);
      setLoading(false);
      return;
    }

    let unsub = () => {};
    try {
      unsub = onAuthStateChanged(auth, async (user) => {
        setFirebaseUser(user);
        if (user && !isRegistering.current) {
          try {
            const profile = await authApi.me();
            setDbUser(profile);
          } catch {
            setDbUser(null);
          }
        } else if (!user) {
          setDbUser(null);
        }
        setLoading(false);
      });
    } catch {
      // Firebase not configured — stay in demo-capable guest mode
      setLoading(false);
    }
    return unsub;
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  const loginWithGoogle = () => signInWithPopup(auth, googleProvider);

  const registerWithGoogle = async ({ role, organisation, community, phone }) => {
    isRegistering.current = true;
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const idToken = await cred.user.getIdToken();
      try {
        const profile = await authApi.register({
          idToken,
          fullName: cred.user.displayName || cred.user.email?.split('@')[0] || 'User',
          role,
          organisation: organisation || '',
          community: community || '',
          phone: phone || '',
        });
        setDbUser(profile);
        return profile;
      } catch (err) {
        if (err?.message === 'User already registered') {
          const profile = await authApi.me();
          setDbUser(profile);
          return profile;
        }
        throw err;
      }
    } finally {
      isRegistering.current = false;
    }
  };

  const register = async ({ email, password, fullName, role, organisation, community, phone }) => {
    isRegistering.current = true;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      const profile = await authApi.register({ idToken, fullName, role, organisation, community, phone });
      setDbUser(profile);
      return profile;
    } finally {
      isRegistering.current = false;
    }
  };

  const enterDemo = (role) => {
    sessionStorage.setItem('rivers_demo_role', role);
    setDbUser(DEMO_USERS[role]);
    setFirebaseUser(null);
  };

  // Switch to a temporary role view (community_leader only → sponsor)
  const switchRole = (role) => setActiveRole(role);
  const resetRole = () => setActiveRole(null);
  // What the UI should use for routing and nav
  const effectiveRole = activeRole ?? dbUser?.role;

  const logout = () => {
    sessionStorage.removeItem('rivers_demo_role');
    setDbUser(null);
    setActiveRole(null);
    try { signOut(auth); } catch { /* Firebase may not be configured */ }
  };

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  const refreshProfile = async () => {
    if (!firebaseUser) return;
    const profile = await authApi.me();
    setDbUser(profile);
    return profile;
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, user: dbUser, loading, effectiveRole, switchRole, resetRole, login, loginWithGoogle, registerWithGoogle, register, logout, resetPassword, refreshProfile, enterDemo }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
