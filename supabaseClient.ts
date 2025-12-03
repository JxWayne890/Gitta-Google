
import { createClient } from '@supabase/supabase-js';

// Helper to get env vars from either Vite's import.meta.env or standard process.env
const getEnvVar = (key: string): string | undefined => {
  try {
    // Check Vite
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key];
    }
  } catch (e) {
    // Ignore error
  }

  try {
    // Check process.env (standard)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    // Ignore error
  }

  return undefined;
};

// 1. Get URL: Use Env Var if available, otherwise use the hardcoded URL provided
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || 'https://wumwjhdzihawygsmwfkn.supabase.co';

// 2. Get Key: Use Env Var if available, otherwise use the provided key
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || 'sb_publishable__z3ywGpyTpu8S4FKNCvEoA_Uv0hfbcD';

if (!supabaseAnonKey) {
    console.warn('Supabase Anon Key is missing. Please set VITE_SUPABASE_ANON_KEY or update supabaseClient.ts');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
