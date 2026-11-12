import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "colaborador";

export interface Profile {
  user_id: string;
  nome_completo: string | null;
  cargo: string | null;
  telefone: string | null;
}

interface AuthState {
  loading: boolean;
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  profile: Profile | null;
  displayName: string;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isColaborador: boolean;
  hasRole: (role: AppRole) => boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<Profile, "nome_completo" | "cargo" | "telefone">>) => Promise<{ error: string | null }>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = async (userId: string | undefined) => {
    if (!userId) {
      setRoles([]);
      setProfile(null);
      return;
    }
    const [rolesRes, profileRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("profiles").select("user_id, nome_completo, cargo, telefone").eq("user_id", userId).maybeSingle(),
    ]);
    if (rolesRes.error) console.error("[auth] roles", rolesRes.error);
    if (profileRes.error) console.error("[auth] profile", profileRes.error);
    setRoles((rolesRes.data ?? []).map((r) => r.role as AppRole));
    setProfile((profileRes.data as Profile | null) ?? null);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      setTimeout(() => { void loadUserData(s?.user.id); }, 0);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      void loadUserData(data.session?.user.id).finally(() => setLoading(false));
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthState>(() => {
    const user = session?.user ?? null;
    const displayName =
      (profile?.nome_completo && profile.nome_completo.trim()) ||
      (user?.email ? user.email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Usuário");
    return {
      loading,
      user,
      session,
      roles,
      profile,
      displayName,
      isAuthenticated: !!user,
      isAdmin: roles.includes("admin"),
      isColaborador: roles.includes("colaborador") || roles.includes("admin"),
      hasRole: (r) => roles.includes(r),
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
      },
      signUp: async (email, password) => {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        return { error: error?.message ?? null };
      },
      signOut: async () => { await supabase.auth.signOut(); },
      refresh: async () => loadUserData(session?.user.id),
      updateProfile: async (patch) => {
        if (!session?.user) return { error: "Sem sessão" };
        const { error } = await supabase
          .from("profiles")
          .upsert({ user_id: session.user.id, ...patch }, { onConflict: "user_id" });
        if (error) return { error: error.message };
        await loadUserData(session.user.id);
        return { error: null };
      },
    };
  }, [session, roles, profile, loading]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
