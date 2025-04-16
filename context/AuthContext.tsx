import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { SupabaseContext } from "./SupabaseContext";
import { User } from "../types";

// Add these constants for test credentials
const TEST_EMAIL = "saymonbrandon@gmail.com";
const TEST_PASSWORD = "@mico123";
const AUTO_LOGIN = process.env.NODE_ENV === 'development';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { supabase } = useContext(SupabaseContext) || { supabase: null };

  useEffect(() => {
    if (!supabase) return;

    // Check for active session
    const checkUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      setUser(session?.user || null);
    });

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [supabase]);

  // Auto-login effect for testing
  useEffect(() => {
    if (!supabase || !AUTO_LOGIN || user) return;

    const autoLogin = async () => {
      try {
        // Remove console.log
        await signIn(TEST_EMAIL, TEST_PASSWORD);
      } catch (error) {
        // Remove console.error
      }
    };

    if (!loading) {
      autoLogin();
    }
  }, [supabase, loading, user]);

  const signIn = async (email: string, password: string): Promise<void> => {
    if (!supabase) throw new Error("Supabase client not initialized");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string): Promise<void> => {
    if (!supabase) throw new Error("Supabase client not initialized");
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    } catch (error) {
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    if (!supabase) throw new Error("Supabase client not initialized");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      throw error;
    }
  };

  return <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => useContext(AuthContext); 