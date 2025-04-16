import React, { createContext, ReactNode } from "react";
import { supabase } from "../lib/supabase";

interface SupabaseContextType {
  supabase: typeof supabase;
}

export const SupabaseContext = createContext<SupabaseContextType | null>(null);

interface SupabaseProviderProps {
  children: ReactNode;
}

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  return <SupabaseContext.Provider value={{ supabase }}>{children}</SupabaseContext.Provider>;
}; 