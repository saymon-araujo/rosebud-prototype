import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = "https://jjavrmtjyzdetuahjkhp.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqYXZybXRqeXpkZXR1YWhqa2hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NTMzOTAsImV4cCI6MjA2MDMyOTM5MH0.izch3eZZAOQEgUTpBuwPVq9jMsje5dnUEGtbBhxAq7g"

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anonymous Key');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}); 