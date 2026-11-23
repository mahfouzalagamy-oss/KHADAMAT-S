import { Router } from 'express';
import { requireIdentity, type VerifyToken } from './auth';
import { getSupabaseAdmin } from './supabase';

const fields = 'id,reference_code,category_id,category_name,service_title,detailed_description,district,address_text,preferred_date,preferred_time,status,created_at';
export interface CustomerRequestReader {
  list(userId: string): Promise<unknown[]>;
  find(userId: string, id: string): Promise<unknown | null>;
}

// Even though the server key bypasses RLS, every query explicitly scopes ownership.
export const customerRequestReader: CustomerRequestReader = {
  async list(userId) {
    const { data, error } = await getSupabaseAdmin().from('service_requests')
      .select(fields).eq('customer_user_id', userId)
      .order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return data ?? [];
  },
  async find(userId, id) {
    const { data, error } = await getSupabaseAdmin().from('service_requests')
      .select(fields).eq('customer_user_id', userId).eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
  },
};

export function customerRequestsRouter(reader: CustomerRequestReader = customerRequestReader, verify?: VerifyToken) {
  const router = Router();
  router.use(requireIdentity(verify));
  router.get('/', async (_req, res) => {
    try {
      res.json({ requests: await reader.list(res.locals.identity.id), limit: 100 });
    } catch {
      res.status(503).json({ error: 'تعذّر تحميل الطلبات. حاول لاحقًا.' });
    }
  });
  router.get('/:id', async (req, res) => {
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(req.params.id)) {
      res.status(400).json({ error: 'معرّف طلب غير صالح.' });
      return;
    }
    try {
      const request = await reader.find(res.locals.identity.id, req.params.id);
      if (!request) {
        // Same response for absent rows and another customer's rows.
        res.status(404).json({ error: 'الطلب غير موجود.' });
        return;
      }
      res.json({ request });
    } catch {
      res.status(503).json({ error: 'تعذّر تحميل الطلب. حاول لاحقًا.' });
    }
  });
  return router;
}
