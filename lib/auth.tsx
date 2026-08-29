import type { Session, User } from "@supabase/supabase-js";
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { normalizeEmail } from "@/lib/auth-validation";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { getPendingInvite } from "@/lib/pending-invite";

interface SignUpInput { email: string; password: string; displayName: string; pendingInviteToken?: string | null }
interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<{ needsEmailConfirmation: boolean }>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => { if (active) { setSession(data.session); setLoading(false); } }).catch(() => { if (active) setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: normalizeEmail(email), password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async ({ email, password, displayName, pendingInviteToken }: SignUpInput) => {
    const storedInvite = await getPendingInvite();
    const { data, error } = await supabase.auth.signUp({
      email: normalizeEmail(email),
      password,
      options: {
        emailRedirectTo: "happyme:///auth/callback",
        data: { display_name: displayName.trim(), pending_invite_token: pendingInviteToken ?? storedInvite?.inviteToken ?? null },
      },
    });
    if (error) throw error;
    return { needsEmailConfirmation: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email), { redirectTo: "happyme:///auth/reset-password" });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const deleteAccount = useCallback(async (password: string) => {
    const email = session?.user.email;
    if (!email) throw new Error("Your account email is unavailable. Sign out and sign in again before deleting.");
    const { error: reauthError } = await supabase.auth.signInWithPassword({ email, password });
    if (reauthError) throw new Error("That password did not match your account.");
    const { error } = await supabase.rpc("delete_my_account");
    if (error) throw error;
    await supabase.auth.signOut({ scope: "local" });
    setSession(null);
  }, [session?.user.email]);

  const value = useMemo<AuthContextValue>(() => ({ session, user: session?.user ?? null, loading, configured: isSupabaseConfigured, signIn, signUp, requestPasswordReset, updatePassword, signOut, deleteAccount }), [session, loading, signIn, signUp, requestPasswordReset, updatePassword, signOut, deleteAccount]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
