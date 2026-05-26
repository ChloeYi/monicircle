import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { signInWithGoogle, signInWithGoogleWeb, signOut as fbSignOut, hasCompletedProfile } from '@/firebase/auth';
import { registerPushToken } from '@/firebase/notifications';

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'needs-profile'; user: User }
  | { status: 'authenticated'; user: User };

type AuthContextValue = {
  state: AuthState;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signInWithGoogleWeb: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  async function resolveUserState(user: User | null) {
    if (!user) {
      setState({ status: 'unauthenticated' });
      return;
    }
    const profileDone = await hasCompletedProfile(user.uid);
    setState(profileDone
      ? { status: 'authenticated', user }
      : { status: 'needs-profile', user }
    );
    if (profileDone) {
      registerPushToken(user.uid).catch(() => {});
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, resolveUserState);
    return unsub;
  }, []);

  async function handleSignInWithGoogle(idToken: string) {
    const user = await signInWithGoogle(idToken);
    await resolveUserState(user);
  }

  async function handleSignInWithGoogleWeb() {
    const user = await signInWithGoogleWeb();
    await resolveUserState(user);
  }

  async function handleSignOut() {
    await fbSignOut();
    setState({ status: 'unauthenticated' });
  }

  async function refreshAuthState() {
    if (auth.currentUser) await resolveUserState(auth.currentUser);
  }

  return (
    <AuthContext.Provider value={{
      state,
      signInWithGoogle: handleSignInWithGoogle,
      signInWithGoogleWeb: handleSignInWithGoogleWeb,
      signOut: handleSignOut,
      refreshAuthState,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
