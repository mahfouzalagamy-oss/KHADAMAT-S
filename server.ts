import 'dotenv/config';
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.local' });
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createHttpServer } from 'http';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { mergeById } from './src/lib/mergeById';
import type { Response as ExpressResponse } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { getSupabaseAdmin } from './server/lib/supabase';
import { requireIdentity } from './server/lib/auth';
import { customerRequestsRouter } from './server/lib/customerRequests';
import { allowLegacyUpgrade, localDemoEnabled, rejectLegacyUpgrade } from './server/lib/legacyRealtimeGuard';

/**
 * Sanitize user-provided input before embedding into AI prompts.
 * Prevents prompt injection by escaping special characters and stripping control chars.
 *
 * @param value - Raw user input string
 * @param maxLength - Max allowed characters (default 500)
 * @returns Sanitized string safe to embed in templates
 */
function sanitizeInput(value: unknown, maxLength = 500): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\x00-\x1f\x7f]/g, '') // remove control characters
    .replace(/[`]/g, '') // strip backticks (template injection)
    .replace(/[\\]/g, '') // strip backslashes
    .replace(/\$/g, '') // strip dollar signs
    .replace(/\{.*?\}/g, '') // strip curly-brace expressions
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitize numeric input, clamping to a safe range.
 *
 * @param value - Raw user input
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Safe integer
 */
function sanitizeNumber(value: unknown, min = 0, max = 99999): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(Math.trunc(n), min), max);
}

/**
 * Validate that an API key is configured before handling AI requests.
 */
function requireApiKey(res: ExpressResponse, geminiApiKey: string | undefined): boolean {
  if (!geminiApiKey || geminiApiKey === 'dummy-key-for-dev-only') {
    res.status(503).json({
      success: false,
      error: 'خدمة الذكاء الاصطناعي غير متاحة حالياً. يرجى التواصل مع الإدارة.',
    });
    return false;
  }
  return true;
}

// ---------- حالة مشتركة لحظية (طلبات/عروض/رسائل/تنبيهات/فنيون) ----------
const SYNC_KEYS = new Set(['requests', 'quotes', 'messages', 'notifications', 'technicians', 'reviews']);
const sharedState: Record<string, any[]> = {};
const liveLocations: Record<string, any> = {};

// Table name mapping: app key -> Supabase table
const TABLE_MAP: Record<string, string> = {
  requests: 'service_requests',
  quotes: 'service_quotes',
  messages: 'messages',
  notifications: 'notifications',
  technicians: 'technicians',
  reviews: 'reviews',
};

// Load state from Supabase on startup
async function loadStateFromSupabase() {
  if (!process.env.SUPABASE_SECRET_KEY) {
    // Fallback to local file if Supabase not configured
    try {
      const STATE_FILE = path.resolve(process.cwd(), 'data', 'state.json');
      Object.assign(sharedState, JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')));
    } catch {
      /* أول تشغيل */
    }
    return;
  }
  for (const key of SYNC_KEYS) {
    const table = TABLE_MAP[key];
    if (!table) continue;
    try {
      const { data, error } = await getSupabaseAdmin().from(table).select('*');
      if (error) {
        console.error(`Failed to load ${key} from Supabase:`, error.message);
        sharedState[key] = [];
      } else {
        sharedState[key] = data || [];
      }
    } catch (e) {
      console.error(`Error loading ${key}:`, e);
      sharedState[key] = [];
    }
  }
  console.log('✅ State loaded from Supabase');
}

let saveTimer: NodeJS.Timeout | null = null;

// Save to Supabase (fire-and-forget)
function scheduleSave() {
  // Debounced save to Supabase
  if (saveTimer) return;
  saveTimer = setTimeout(async () => {
    saveTimer = null;
    if (!process.env.SUPABASE_SECRET_KEY) {
      // Fallback to local file
      try {
        const STATE_FILE = path.resolve(process.cwd(), 'data', 'state.json');
        fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
        fs.writeFileSync(STATE_FILE, JSON.stringify(sharedState));
      } catch (e) {
        console.error('تعذّر حفظ الحالة:', e);
      }
      return;
    }
    // Upsert to Supabase
    for (const key of SYNC_KEYS) {
      const table = TABLE_MAP[key];
      if (!table || !sharedState[key]) continue;
      try {
        await getSupabaseAdmin().from(table).upsert(sharedState[key], { onConflict: 'id' });
      } catch (e) {
        console.error(`Failed to save ${key} to Supabase:`, e);
      }
    }
  }, 1000);
}


function attachRealtime(server: ReturnType<typeof createHttpServer>) {
  // noServer: نعالج مسار /ws فقط حتى لا نتعارض مع websocket الخاص بـ Vite (HMR)
  const wss = new WebSocketServer({ noServer: true, maxPayload: 25 * 1024 * 1024 });
  server.on('upgrade', (req, socket, head) => {
    if (req.url?.split('?')[0] !== '/ws') return;
    if (!allowLegacyUpgrade(req, process.env)) {
      rejectLegacyUpgrade(socket);
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  });

  const broadcast = (payload: unknown, except?: WebSocket) => {
    const data = JSON.stringify(payload);
    wss.clients.forEach((c) => {
      if (c !== except && c.readyState === WebSocket.OPEN) c.send(data);
    });
  };

  wss.on('connection', (ws) => {
    (ws as any).alive = true;
    ws.on('pong', () => ((ws as any).alive = true));
    ws.send(JSON.stringify({ type: 'snapshot', state: sharedState, locations: liveLocations }));

    ws.on('message', (raw) => {
      let msg: any;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (msg.type === 'sync' && SYNC_KEYS.has(msg.key) && Array.isArray(msg.value)) {
        sharedState[msg.key] = mergeById(sharedState[msg.key] ?? [], msg.value);
        scheduleSave();
        broadcast({ type: 'sync', key: msg.key, value: sharedState[msg.key] });
      } else if (msg.type === 'location' && msg.location?.requestId) {
        liveLocations[msg.location.requestId] = msg.location;
        broadcast({ type: 'location', location: msg.location }, ws);
        // Persist to Supabase (fire-and-forget)
        if (process.env.SUPABASE_SECRET_KEY) {
          void (async () => {
            try {
              await getSupabaseAdmin().from('technician_locations').upsert({
                request_id: msg.location.requestId,
                technician_id: msg.location.technicianId,
                lat: msg.location.lat,
                lng: msg.location.lng,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'request_id' });
            } catch { /* ignore */ }
          })();
        }
      } else if (msg.type === 'location_end' && msg.requestId) {
        delete liveLocations[msg.requestId];
        broadcast({ type: 'location_end', requestId: msg.requestId }, ws);
        // Remove from Supabase (fire-and-forget)
        if (process.env.SUPABASE_SECRET_KEY) {
          void (async () => {
            try {
              await getSupabaseAdmin().from('technician_locations').delete().eq('request_id', msg.requestId);
            } catch { /* ignore */ }
          })();
        }
      }
    });
  });

  setInterval(() => {
    wss.clients.forEach((c) => {
      if ((c as any).alive === false) return c.terminate();
      (c as any).alive = false;
      c.ping();
    });
  }, 30000);
}

async function startServer() {
  // Load state from Supabase on startup
  if (localDemoEnabled(process.env)) await loadStateFromSupabase();

  const app = express();
  const httpServer = createHttpServer(app);
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/auth/me', requireIdentity(), (_req, res) => {
    res.json({ userId: res.locals.identity.id });
  });
  app.use('/api/customer/requests', customerRequestsRouter());

  // بوابة لوحة الإدارة: كلمة المرور من متغير البيئة ADMIN_PASSWORD
  app.post('/api/admin/login', (req, res) => {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
      return res.status(503).json({ success: false, error: 'لوحة الإدارة غير مفعّلة: ضع ADMIN_PASSWORD في .env.local' });
    }
    if (req.body?.password === expected) return res.json({ success: true });
    res.status(401).json({ success: false, error: 'كلمة المرور غير صحيحة' });
  });

  // Phone verification is now handled by Supabase Auth in the client.
  // Retire legacy endpoints: no generated codes, console SMS fallback or fake sessions.
  app.post(['/api/auth/send-otp', '/api/auth/verify-otp'], (_req, res) => {
    res.status(410).json({ success: false, error: 'يرجى تحديث التطبيق لاستخدام تسجيل الدخول الآمن.' });
  });

  // Validate Gemini API key
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    console.error('⚠️ GEMINI_API_KEY is not set. AI features will not work.');
    // We still start the server but AI endpoints will return errors
    // You can also choose to exit: process.exit(1);
  }

  const ai = new GoogleGenAI({
    apiKey: geminiApiKey || 'dummy-key-for-dev-only',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  app.post('/api/ai/smart-plan', requireIdentity(), async (req, res) => {
    try {
      if (!requireApiKey(res, process.env.GEMINI_API_KEY)) return;

      const homeType = sanitizeInput(req.body.homeType, 50);
      const acUnits = sanitizeNumber(req.body.acUnits, 0, 20);
      const seasonFocus = sanitizeInput(req.body.seasonFocus, 50);
      const district = sanitizeInput(req.body.district, 100);

      // Validate required fields
      if (!homeType || !seasonFocus || !district) {
        res.status(400).json({
          success: false,
          error: 'بيانات ناقصة: المنزل، التركيز الموسمي، والمنطقة مطلوبة.',
        });
        return;
      }

      const prompt = `أنت مساعد تخطيط ذكي لمنزل في ${district} بمصر. نوع المنزل: ${homeType}، عدد التكييفات: ${acUnits}، التركيز الموسمي: ${seasonFocus}. اقترح 3 توصيات صيانة دقيقة وفعالة باللغة العربية لتجنب الأعطال المفاجئة مع أسبابها وتوقيتها.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          systemInstruction: 'أنت مهندس صيانة منزلية خبير ومستشار ذكي لمنصة خدمات في الدقهلية بمصر. قدم نصائح عملية وموثوقة باللغة العربية.',
        },
      });

      res.json({ success: true, planText: response.text });
    } catch (err: any) {
      console.error('Gemini AI error:', err);
      res.status(500).json({ success: false, error: err.message || 'AI service error' });
    }
  });

  app.post('/api/ai/analyze-fault', requireIdentity(), async (req, res) => {
    try {
      if (!requireApiKey(res, process.env.GEMINI_API_KEY)) return;

      const description = sanitizeInput(req.body.description, 2000);

      // Validate required fields
      if (!description || description.length < 5) {
        res.status(400).json({
          success: false,
          error: 'يرجى وصف العطل بشكل أوضح (على الأقل 5 أحرف).',
        });
        return;
      }

      const prompt = `أنت شات بوت ذكي ومهندس صيانة فني لمنصة 'خدمات' في مصر. قم بتحليل وصف العطل التالي الذي كتبه العميل: "${description}".
      أعطني إجابة بتنسيق JSON حصراً يحتوي على الخصائص التالية:
      - suggestedCategoryId: معرف القسم المناسب (مثل ac, plumbing, electrical, cleaning, carpentry, appliances, electronics, networks)
      - suggestedServiceTitle: اسم الخدمة المقترحة بدقة
      - spareParts: مصفوفة من قطع الغيار المحتملة المطلوبة للإصلاح (مثل كباس، صمام، مفتاح، مانع تسريب...)
      - advice: نصائح تحضيرية سريعة للعميل باللغة العربية
      - analysisText: تحليل شامل وموجز للعطل باللغة العربية`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          systemInstruction: 'أنت مساعد ذكي لخدمات الصيانة المنزلية. أجب بصيغة JSON صالحة باللغة العربية.',
          responseMimeType: 'application/json',
        },
      });

      let parsed = null;
      try {
        parsed = JSON.parse(response.text || '{}');
      } catch {
        parsed = {
          suggestedCategoryId: 'ac',
          suggestedServiceTitle: 'فحص عطل صيانة منزلية',
          spareParts: ['فحص فني شامل'],
          advice: 'تأكد من فصل التيار أو إيقاف الأجهزة لحين وصول الفني.',
          analysisText: response.text || 'تم تحليل العطل وجاري توجيه الفني المناسب.',
        };
      }

      res.json({ success: true, analysis: parsed });
    } catch (err: any) {
      console.error('Gemini fault analysis error:', err);
      res.status(500).json({ success: false, error: err.message || 'AI service error' });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const dist = path.resolve(process.cwd(), 'dist');
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, ws: { server: httpServer } },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  attachRealtime(httpServer);

  const port = Number(process.env.PORT) || 3000;
  httpServer.listen(port, localDemoEnabled(process.env) ? '127.0.0.1' : '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer();
