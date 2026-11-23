import { supabase } from './supabase';

/** Only same-origin API paths may receive the user's token. */
export async function authenticatedApi(path: string, init: RequestInit = {}): Promise<Response> {
  if (!/^\/api\/[a-zA-Z0-9/_-]+$/.test(path)) throw new Error('Invalid API path');
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error('سجّل الدخول لاستخدام هذه الخدمة.');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${data.session.access_token}`);
  return fetch(path, { ...init, headers, redirect: 'error' });
}
