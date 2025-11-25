
import { createClient } from '@supabase/supabase-js';

// Fallback values for environments where import.meta.env is not populated (e.g. browser-native ESM)
const FALLBACK_URL = 'https://ttmnxegayzckxaclljla.supabase.co';
const FALLBACK_KEY = 'sb_publishable_mP-6MTOW-5Ald18xE5kMyg_fa5EO2EE';

const getEnvVar = (key: string, fallback: string): string => {
  try {
    const env = (import.meta as any).env;
    return env && env[key] ? env[key] : fallback;
  } catch (e) {
    return fallback;
  }
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', FALLBACK_URL);
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', FALLBACK_KEY);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
