import { supabase } from "@/integrations/supabase/client";
import { fetchOwnProfile, profileToMe, type ProfileRow } from "@/lib/api";
import { defaultState, type Me } from "@/lib/store";
import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface AuthValue {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: ProfileRow | null;
  me: Me;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  async function loadProfile(userId: string) {
    try {
      const row = await fetchOwnProfile(userId);
      setProfile(row);
    } catch (err) {
      console.error("[auth] failed to load profile", err);
      setProfile(null);
    }
  }

  useEffect(() => {
    let mounted = true;
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        if (data.session?.user) await loadProfile(data.session.user.id);
        else setProfile(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next?.user) void loadProfile(next.user.id);
      else setProfile(null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthValue>(() => {
    const user = session?.user ?? null;
    return {
      loading,
      session,
      user,
      profile,
      me: profile ? profileToMe(profile) : { ...defaultState.me, email: user?.email ?? "" },
      refreshProfile: async () => {
        if (user) await loadProfile(user.id);
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setProfile(null);
      },
    };
  }, [loading, session, profile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
