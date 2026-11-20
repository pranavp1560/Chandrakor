import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get credentials from Vite env or fallback to process.env if applicable
const metaEnv = (import.meta as any).env || {};
const procEnv = typeof process !== 'undefined' ? process.env : {};

const supabaseUrl =
  metaEnv.VITE_SUPABASE_URL ||
  procEnv.VITE_SUPABASE_URL ||
  'https://redrcbdmoxfamzkqamrg.supabase.co';

const supabaseKey =
  metaEnv.VITE_SUPABASE_ANON_KEY ||
  metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
  procEnv.VITE_SUPABASE_ANON_KEY ||
  procEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_TeCkt9yM_oOx6thMjsdmAA_SllAHRJl';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Chandrakor Supabase: Missing Supabase URL or Publishable/Anon key in environment.');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
