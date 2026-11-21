import { Bot, Sparkles, Wand2, X } from 'lucide-react';
import { useState } from 'react';
import {
  PlannerHomeType,
  PlannerSeasonFocus,
  SeasonalBundle,
  ServiceItem,
  UserProfile,
} from '../types/khadamat';

interface SmartPlannerModalProps {
  isOpen: boolean;
  district: string;
  user: UserProfile;
  onClose: () => void;
  onRequestService: (service?: ServiceItem, categoryId?: string) => void;
  onRequestBundle?: (bundle: SeasonalBundle) => void;
}

export function SmartPlannerModal({
  isOpen,
  district,
  user: _user,
  onClose,
  onRequestService,
  onRequestBundle: _onRequestBundle,
}: SmartPlannerModalProps) {
  const [homeType, setHomeType] = useState<PlannerHomeType>('apartment');
  const [acUnits, setAcUnits] = useState<number>(2);
  const [seasonFocus, setSeasonFocus] = useState<PlannerSeasonFocus>('summer');
  const [isLoading, setIsLoading] = useState(false);
  const [aiPlanText, setAiPlanText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/ai/smart-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeType:
            homeType === 'apartment'
              ? 'شقة سكنية'
              : homeType === 'villa'
                ? 'فيلا مستقلة'
                : 'مكتب إداري',
          acUnits,
          seasonFocus:
            seasonFocus === 'summer'
              ? 'ذروة الصيف والحر الشديد'
              : seasonFocus === 'winter'
                ? 'موسم الشتاء والأمطار'
                : 'صيانة وقائية طوال العام',
          district,
        }),
      });
      const data = await res.json().catch(() => ({ success: false, error: 'خدمة الخطة الذكية غير متاحة حالياً. تأكد من تشغيل الخادم وضبط GEMINI_API_KEY.' }));
      if (data.success && data.planText) {
        setAiPlanText(data.planText);
      } else {
        setErrorMessage(data.error || 'تعذر توليد خطة الصيانة الذكية حالياً.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ في الاتصال بخدمة الذكاء الاصطناعي.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-0 md:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full md:max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-2xl border border-orange-200 dark:border-slate-800 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="md:hidden w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 shrink-0" />

        <div className="flex items-center justify-between px-5 md:px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-orange-50/50 dark:bg-orange-950/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FF5A00] text-white flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                مساعد التخطيط الذكي للصيانة (Gemini AI)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تحليل ذكي مخصص لمنزلك في {district} لتجنب الأعطال المفاجئة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 md:p-6 overflow-y-auto space-y-6">
          {!aiPlanText ? (
            <form onSubmit={handleGeneratePlan} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  نوع العقار السكني
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'apartment', label: 'شقة سكنية' },
                    { id: 'villa', label: 'فيلا أو توبريكس' },
                    { id: 'office', label: 'مكتب / عيادة' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setHomeType(item.id as PlannerHomeType)}
                      className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                        homeType === item.id
                          ? 'bg-[#FF5A00] border-[#FF5A00] text-white dark:bg-orange-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  عدد أجهزة التكييف بالمنزل
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setAcUnits(num)}
                      className={`flex-1 min-h-[42px] rounded-xl border text-xs font-bold transition-colors cursor-pointer tabular-nums ${
                        acUnits === num
                          ? 'bg-[#FF5A00] border-[#FF5A00] text-white'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {num} {num === 1 ? 'تكييف' : 'أجهزة'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  التركيز الموسمي الحالي
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'summer', label: 'ذروة الصيف (تكييف وفريون)' },
                    { id: 'winter', label: 'الشتاء والأمطار (سخانات وصرف)' },
                    { id: 'year_round', label: 'صيانة شاملة طوال العام' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSeasonFocus(s.id as PlannerSeasonFocus)}
                      className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                        seasonFocus === s.id
                          ? 'bg-[#FF5A00] border-[#FF5A00] text-white'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {errorMessage && (
                <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-800 dark:text-rose-300 rounded-xl p-3 text-xs">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[48px] px-5 py-3 bg-[#FF5A00] hover:bg-orange-700 dark:bg-orange-600 text-white text-sm font-bold rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري تحليل خطة الصيانة الذكية بالذكاء الاصطناعي...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>توليد خطة الصيانة المخصصة بالذكاء الاصطناعي</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="bg-orange-50/70 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#FF5A00] dark:text-orange-400 inline-flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>خطة الصيانة الذكية الموصى بها لمنزلك</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setAiPlanText(null)}
                    className="text-xs font-bold text-slate-600 dark:text-slate-300 underline cursor-pointer"
                  >
                    إعادة ضبط الإعدادات
                  </button>
                </div>
                <div className="text-xs md:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  {aiPlanText}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRequestService();
                  }}
                  className="flex-1 min-h-[46px] px-5 py-2.5 bg-[#FF5A00] text-white text-xs font-bold rounded-xl hover:bg-orange-700 transition-colors cursor-pointer"
                >
                  حجز خدمة مقترحة من الخطة
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[46px] px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
