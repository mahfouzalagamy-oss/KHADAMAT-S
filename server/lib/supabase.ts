import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client;
  const supabaseUrl = process.env.SUPABASE_URL || 'https://stvfehwqcnpygdhlvalw.supabase.co';
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';
  _client = createClient(supabaseUrl, supabaseSecretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _client;
}

// For backward compatibility
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    return (client as any)[prop];
  },
});