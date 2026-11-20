import { createServer as createHttpServer } from 'http';
import express from 'express';
import type { Response as ExpressResponse } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

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

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  app.use(express.json());

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

  app.post('/api/ai/smart-plan', async (req, res) => {
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

  app.post('/api/ai/analyze-fault', async (req, res) => {
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

  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      ws: { server: httpServer },
    },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  const port = Number(process.env.PORT) || 3000;
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer();
