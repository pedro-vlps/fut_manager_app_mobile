import { createContext, PropsWithChildren, useCallback, useContext, useState } from 'react';
import { Profile, request, Session } from '@/services/api';

type Auth = {
  session: Session | null;
  notice: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  expireSession: () => void;
  updateProfile: (profile: Profile) => void;
};
const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  // A sessão fica apenas na memória; senhas e tokens não são gravados no dispositivo.
  const [session, setSession] = useState<Session | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const signIn = useCallback(async (email: string, password: string) => {
    const result = await request<Session>('/auth/login', { method: 'POST', body: JSON.stringify({ email: email.trim(), password }) });
    setNotice(null);
    setSession(result);
  }, []);
  const signOut = useCallback(() => {
    if (session) void request('/auth/logout', { method: 'POST' }, session.access_token).catch(() => {});
    setSession(null);
    setNotice(null);
  }, [session]);
  const expireSession = useCallback(() => {
    setSession(null);
    setNotice('Sua sessão expirou. Entre novamente para continuar.');
  }, []);
  const updateProfile = useCallback((profile: Profile) => {
    setSession(current => current?.profile.id === profile.id ? { ...current, profile } : current);
  }, []);
  return <AuthContext.Provider value={{ session, notice, signIn, signOut, expireSession, updateProfile }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return auth;
}
