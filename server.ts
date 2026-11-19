import 'dotenv/config';
import dotenv from 'dotenv';
import express from 'express';
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

async function startServer() {
  const app = express();
  app.use(express.json());

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
    const path = await import('node:path');
    const dist = path.resolve(process.cwd(), 'dist');
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  } else {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => console.log(`Server running on port ${port}`));
}

startServer();
