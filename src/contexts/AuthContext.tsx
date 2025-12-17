import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "user" | "moderator" | "admin";

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  twitch_username: string | null;
  discord_tag: string | null;
  bio: string | null;
  points: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  isLoading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const buildProfileInsert = (supabaseUser: User) => {
    const meta = (supabaseUser.user_metadata || {}) as Record<string, any>;
    const provider = (supabaseUser.app_metadata || {})?.provider as string | undefined;

    const username =
      meta.preferred_username ||
      meta.user_name ||
      meta.name ||
      (supabaseUser.email ? supabaseUser.email.split("@")[0] : null);

    const displayName = meta.full_name || meta.name || username;

    return {
      user_id: supabaseUser.id,
      username: username ?? null,
      display_name: displayName ?? null,
      avatar_url: (meta.avatar_url as string | undefined) ?? null,
      twitch_username: provider === "twitch" ? (username ?? null) : null,
      // Discord often exposes full_name (e.g. DisplayName#1234) rather than a clean username
      discord_tag: provider === "discord" ? ((meta.full_name as string | undefined) ?? (username ?? null)) : null,
    };
  };

  const fetchProfile = async (supabaseUser: User) => {
    const userId = supabaseUser.id;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    // If the user signed in via OAuth and the DB trigger didn't create the profile (common in local dev), create it client-side.
    if (!profileData) {
      const { error: insertError } = await supabase.from("profiles").insert(buildProfileInsert(supabaseUser));
      // If it was created by a parallel process, ignore conflict-like failures.
      if (!insertError) {
        const { data: createdProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();
        if (createdProfile) setProfile(createdProfile as Profile);
      }
    } else {
      setProfile(profileData as Profile);
    }

    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (rolesData) {
      setRoles(rolesData.map((r) => r.role as AppRole));
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer profile fetch to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user).finally(() => {
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  };

  const isAdmin = roles.includes("admin");
  const isModerator = roles.includes("moderator") || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        isLoading,
        isAdmin,
        isModerator,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
