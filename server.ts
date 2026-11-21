import 'dotenv/config';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { WebSocketServer, WebSocket } from 'ws';
import { mergeById } from './src/lib/mergeById';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config({ path: '.env.local' });

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// عميل Gemini يُنشأ عند أول طلب فقط، فلا ينهار الخادم إذا لم يُضبط المفتاح
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
}

const NO_KEY_MESSAGE =
  'خدمة الذكاء الاصطناعي غير مفعّلة: أضف GEMINI_API_KEY في ملف .env.local ثم أعد تشغيل الخادم.';

// ---------- حالة مشتركة لحظية (طلبات/عروض/رسائل/تنبيهات/فنيون) ----------
const STATE_FILE = path.resolve(process.cwd(), 'data', 'state.json');
const SYNC_KEYS = new Set(['requests', 'quotes', 'messages', 'notifications', 'technicians', 'reviews']);
const sharedState: Record<string, any[]> = {};
const liveLocations: Record<string, any> = {};

try {
  Object.assign(sharedState, JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')));
} catch {
  /* أول تشغيل */
}

let saveTimer: NodeJS.Timeout | null = null;
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
      fs.writeFileSync(STATE_FILE, JSON.stringify(sharedState));
    } catch (e) {
      console.error('تعذّر حفظ الحالة:', e);
    }
  }, 1000);
}

function attachRealtime(server: http.Server) {
  const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 25 * 1024 * 1024 });
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
      } else if (msg.type === 'location_end' && msg.requestId) {
        delete liveLocations[msg.requestId];
        broadcast({ type: 'location_end', requestId: msg.requestId }, ws);
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
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // بوابة لوحة الإدارة: كلمة المرور من متغير البيئة ADMIN_PASSWORD
  app.post('/api/admin/login', (req, res) => {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
      return res.status(503).json({ success: false, error: 'لوحة الإدارة غير مفعّلة: ضع ADMIN_PASSWORD في .env.local' });
    }
    if (req.body?.password === expected) return res.json({ success: true });
    res.status(401).json({ success: false, error: 'كلمة المرور غير صحيحة' });
  });

  app.post('/api/ai/smart-plan', async (req, res) => {
    const ai = getAI();
    if (!ai) return res.status(503).json({ success: false, error: NO_KEY_MESSAGE });
    try {
      const { homeType, acUnits, seasonFocus, district } = req.body ?? {};
      const prompt = `أنت مساعد تخطيط ذكي لمنزل في ${district} بمصر. نوع المنزل: ${homeType}، عدد التكييفات: ${acUnits}، التركيز الموسمي: ${seasonFocus}. اقترح 3 توصيات صيانة دقيقة وفعالة باللغة العربية لتجنب الأعطال المفاجئة مع أسبابها وتوقيتها.`;
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          systemInstruction:
            'أنت مهندس صيانة منزلية خبير ومستشار ذكي لمنصة خدمات في الدقهلية بمصر. قدم نصائح عملية وموثوقة باللغة العربية.',
        },
      });
      res.json({ success: true, planText: response.text });
    } catch (err: any) {
      console.error('Gemini AI error:', err);
      res.status(500).json({ success: false, error: err.message || 'AI service error' });
    }
  });

  app.post('/api/ai/analyze-fault', async (req, res) => {
    const ai = getAI();
    if (!ai) return res.status(503).json({ success: false, error: NO_KEY_MESSAGE });
    try {
      const { description } = req.body ?? {};
      const prompt = `أنت شات بوت ذكي ومهندس صيانة فني لمنصة 'خدمات' في مصر. قم بتحليل وصف العطل التالي الذي كتبه العميل: "${description}".
      أعطني إجابة بتنسيق JSON حصراً يحتوي على الخصائص التالية:
      - suggestedCategoryId: معرف القسم المناسب (مثل ac, plumbing, electrical, cleaning, carpentry, appliances, electronics, networks)
      - suggestedServiceTitle: اسم الخدمة المقترحة بدقة
      - spareParts: مصفوفة من قطع الغيار المحتملة المطلوبة للإصلاح
      - advice: نصائح تحضيرية سريعة للعميل باللغة العربية
      - analysisText: تحليل شامل وموجز للعطل باللغة العربية`;
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          systemInstruction: 'أنت مساعد ذكي لخدمات الصيانة المنزلية. أجب بصيغة JSON صالحة باللغة العربية.',
          responseMimeType: 'application/json',
        },
      });
      let parsed: unknown;
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
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT) || 3000;
  const server = http.createServer(app);
  attachRealtime(server);
  server.listen(port, '0.0.0.0', () => console.log(`Server running on port ${port}`));
}

startServer();
