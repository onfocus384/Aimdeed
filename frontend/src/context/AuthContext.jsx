import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { requireSupabase, setAccessToken } from "../lib/supabase";

const AuthContext = createContext(null);

const normalizeUser = (supabaseUser) => {
  if (!supabaseUser) return null;
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    username:
      supabaseUser.user_metadata?.username ||
      supabaseUser.email?.split("@")[0] ||
      "user",
    displayName: supabaseUser.user_metadata?.full_name || null,
    createdAt: supabaseUser.created_at,
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let subscription = null;

    const applySession = (session) => {
      if (!active) return;
      setAccessToken(session?.access_token || null);
      setUser(normalizeUser(session?.user || null));
      setLoading(false);
    };

    try {
      const supabase = requireSupabase();

      supabase.auth.getSession().then(({ data }) => {
        if (!active) return;
        applySession(data.session);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (!active) return;
          applySession(session);
        },
      );
      subscription = authListener.subscription;
    } catch (err) {
      console.error("Supabase auth init error:", err.message);
      setLoading(false);
    }

    return () => {
      active = false;
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const supabase = requireSupabase();
      const { data: userData } = await supabase.auth.getUser();
      const { data: sessionData } = await supabase.auth.getSession();
      setAccessToken(sessionData.session?.access_token || null);
      setUser(normalizeUser(userData.user));
    } catch {
      setUser(null);
    }
  }, []);

  const login = async ({ email, password }) => {
    const supabase = requireSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });
    if (error) throw error;
    return data;
  };

  const signup = async ({ username, email, password, firstName, lastName }) => {
    const supabase = requireSupabase();
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          username: username.trim(),
          full_name: `${firstName} ${lastName}`.trim(),
        },
      },
    });
    if (error) throw error;
    return data;
  };

  const signInWithGoogle = async () => {
    const supabase = requireSupabase();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  };

  const logout = async () => {
    const supabase = requireSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, signInWithGoogle, logout, refresh: loadUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
