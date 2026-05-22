import { createClient } from '@supabase/supabase-js';

const devFallbackUrl = 'http://localhost:54321';
const devFallbackAnonKey = 'public-anon-key';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL?.trim() ||
  (import.meta.env.DEV ? devFallbackUrl : undefined);
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ||
  (import.meta.env.DEV ? devFallbackAnonKey : undefined);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in environment variables.'
  );
}

// Initialize the real Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
