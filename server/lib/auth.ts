import { createClient } from '@supabase/supabase-js';
import type { RequestHandler } from 'express';

export interface VerifiedIdentity { id: string }
export type VerifyToken = (token: string) => Promise<VerifiedIdentity | null>;

// getUser validates the token with Auth. Never trust a decoded JWT or request body.
export const verifySupabaseToken: VerifyToken = async (token) => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Authentication is not configured');
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user || data.user.is_anonymous) return null;
  return { id: data.user.id };
};

export function requireIdentity(verify: VerifyToken = verifySupabaseToken): RequestHandler {
  return async (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    const authorization = req.headers.authorization;
    const match = authorization?.match(/^Bearer ([^\s,]+)$/i);
    if (!match || match[1].length > 8192) {
      res.status(401).json({ success: false, error: 'يلزم تسجيل الدخول.' });
      return;
    }
    try {
      const identity = await verify(match[1]);
      if (!identity) {
        res.status(401).json({ success: false, error: 'انتهت الجلسة أو أصبحت غير صالحة.' });
        return;
      }
      res.locals.identity = identity;
      next();
    } catch {
      res.status(503).json({ success: false, error: 'تعذّر التحقق من الجلسة. حاول لاحقًا.' });
    }
  };
}
