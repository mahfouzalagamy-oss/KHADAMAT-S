import {
  Award,
  Banknote,
  Building2,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Lock,
  MapPin,
  MessageCircle,
  MessageSquare,
  Navigation,
  Pause,
  Phone,
  Play,
  Repeat,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Timer,
  Trash2,
  TrendingDown,
  Wallet,
  Wrench,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  FAST_QUOTE_WINDOW_MINUTES,
  WALLET_PROVIDERS,
  buildWhatsAppLink,
  computeDiscountedPrice,
  computeQuoteMarketComparison,
  computeRequestCostSavingsSummary,
  computeTechnicianStats,
  formatArabicDateLabel,
  formatEGP,
  getFastQuoteWindowStatus,
  getPaymentMethodLabel,
  getRecurrenceLabel,
} from '../data/khadamatData';
import {
  PaymentMethod,
  RecurringSchedule,
  RequestMessage,
  ServiceQuote,
  ServiceRequest,
  ServiceRequestStatus,
  Technician,
  TechnicianReview,
  UserRole,
} from '../types/khadamat';
import {
  DigitalWarrantyCard,
  SmartQuoteComparisonStrip,
} from './DigitalWarrantyCard';
import { LiveTechnicianRouteMap } from './LiveTechnicianRouteMap';
import {
  CompletedOrderSummaryData,
  OrderCompletionModal,
} from './OrderCompletionModal';

interface CustomerRequestsScreenProps {
  requests: ServiceRequest[];
  quotes: ServiceQuote[];
  messages: RequestMessage[];
  reviews: TechnicianReview[];
  recurringSchedules: RecurringSchedule[];
  onAcceptQuote: (
    requestId: string,
    quoteId: string,
    paymentMethod?: PaymentMethod,
    walletProvider?: string
  ) => void;
  onCancelRequest: (requestId: string) => void;
  onRateTechnician: (requestId: string, rating: number, review: string) => void;
  onSendMessage: (
    requestId: string,
    technicianId: string,
    technicianName: string,
    senderRole: UserRole,
    text: string
  ) => void;
  onViewTechnicianStats: (technicianId: string) => void;
  onTriggerRecurringNow: (
    scheduleId: string
  ) => { referenceCode: string; notifiedCount: number } | null;
  onToggleRecurringStatus: (scheduleId: string) => void;
  onCancelRecurringSchedule: (scheduleId: string) => void;
  onNewRequest: () => void;
  onRequestWarrantyCheck?: (request: ServiceRequest, quote?: ServiceQuote) => void;
  technicians?: Technician[];
  initialTab?: RequestsTab;
  isDark?: boolean;
}

type RequestsTab = 'open' | 'active' | 'history' | 'recurring';

const TRACKING_STAGES: {
  id: Exclude<ServiceRequestStatus, 'cancelled'>;
  label: string;
}[] = [
  { id: 'open_for_quotes', label: 'استقبال العروض' },
  { id: 'quote_accepted', label: 'تأكيد العرض' },
  { id: 'en_route', label: 'الفني في الطريق' },
  { id: 'in_progress', label: 'جاري التنفيذ' },
  { id: 'completed', label: 'مكتمل' },
];

function getTrackingStageIndex(status: ServiceRequestStatus): number {
  const idx = TRACKING_STAGES.findIndex((s) => s.id === status);
  return idx >= 0 ? idx : 0;
}

export function CustomerRequestsScreen({
  requests,
  quotes,
  messages,
  reviews,
  recurringSchedules,
  onAcceptQuote,
  onCancelRequest,
  onRateTechnician,
  onSendMessage,
  onViewTechnicianStats,
  onTriggerRecurringNow,
  onToggleRecurringStatus,
  onCancelRecurringSchedule,
  onNewRequest,
  onRequestWarrantyCheck,
  technicians = [],
  initialTab,
  isDark = false,
}: CustomerRequestsScreenProps) {
  const [tab, setTab] = useState<RequestsTab>(initialTab || 'open');
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);
  const [openChatKey, setOpenChatKey] = useState<string | null>(null);
  const [highlightedQuoteId, setHighlightedQuoteId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState<string>('');
  const [ratingRequestId, setRatingRequestId] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [cancelScheduleId, setCancelScheduleId] = useState<string | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [triggerFeedback, setTriggerFeedback] = useState<{
    serviceTitle: string;
    referenceCode: string;
    notifiedCount: number;
  } | null>(null);
  const [confirmingOrder, setConfirmingOrder] = useState<{
    request: ServiceRequest;
    quote: ServiceQuote;
  } | null>(null);
  const [confirmPaymentMethod, setConfirmPaymentMethod] =
    useState<PaymentMethod>('cash');
  const [confirmWalletProvider, setConfirmWalletProvider] = useState<string>(
    WALLET_PROVIDERS[0]
  );
  const [completedOrderSummary, setCompletedOrderSummary] =
    useState<CompletedOrderSummaryData | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const openList = useMemo(
    () => requests.filter((r) => r.status === 'open_for_quotes'),
    [requests]
  );
  const activeList = useMemo(
    () =>
      requests.filter(
        (r) =>
          r.status === 'quote_accepted' ||
          r.status === 'en_route' ||
          r.status === 'in_progress'
      ),
    [requests]
  );
  const historyList = useMemo(
    () =>
      requests.filter(
        (r) => r.status === 'completed' || r.status === 'cancelled'
      ),
    [requests]
  );
  const visibleSchedules = useMemo(
    () => recurringSchedules.filter((s) => s.status !== 'cancelled'),
    [recurringSchedules]
  );
  const activeRecurringCount = visibleSchedules.filter(
    (s) => s.status === 'active'
  ).length;

  const currentList =
    tab === 'open' ? openList : tab === 'active' ? activeList : historyList;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 pb-14">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
            طلباتي وعروض الأسعار
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            تتبع الفني لحظياً، قارن الأسعار، واضغط «موافق» على العرض الأنسب
          </p>
        </div>

        <button
          type="button"
          onClick={onNewRequest}
          className="px-5 py-2.5 min-h-[44px] bg-[#FF5A00] text-white text-sm font-semibold rounded-xl hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm shadow-orange-600/15"
        >
          طلب خدمة جديدة
        </button>
      </div>

      {/* Segmented Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl w-full sm:w-fit overflow-x-auto no-scrollbar">
        {[
          { id: 'open' as RequestsTab, label: `بانتظار اختيار عرض (${openList.length})` },
          { id: 'active' as RequestsTab, label: `جارية وفي الطريق (${activeList.length})` },
          { id: 'history' as RequestsTab, label: `مكتملة وملغاة (${historyList.length})` },
          {
            id: 'recurring' as RequestsTab,
            label: `الطلبات المتكررة (${activeRecurringCount})`,
          },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`min-h-[42px] px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              tab === item.id
                ? 'bg-white text-orange-700 shadow-sm dark:bg-slate-900 dark:text-orange-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Recurring Tab OR Regular Requests List */}
      {tab === 'recurring' ? (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                <Repeat className="w-4 h-4 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                <span>الطلبات المتكررة تلقائياً</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                يُنشأ طلب جديد تلقائياً في الموعد المحدد مع تنبيه فنيي منطقتك.
              </p>
            </div>
          </div>

          {triggerFeedback && (
            <div className="bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 text-xs text-orange-950 dark:text-orange-100">
                <CheckCircle2 className="w-4 h-4 text-[#FF5A00] dark:text-orange-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold">
                    تم إنشاء الطلب الدوري بنجاح (#{triggerFeedback.referenceCode})
                  </div>
                  <div className="text-orange-800 dark:text-orange-300">
                    خدمة «{triggerFeedback.serviceTitle}» — تم إرسال تنبيه إلى{' '}
                    <span className="font-bold tabular-nums">
                      {triggerFeedback.notifiedCount}
                    </span>{' '}
                    فني/شركة مختصة في نطاقك.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTriggerFeedback(null);
                  setTab('open');
                }}
                className="min-h-[40px] px-4 py-2 text-xs font-bold text-white bg-[#FF5A00] hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
              >
                عرض الطلب المفتوح
              </button>
            </div>
          )}

          {visibleSchedules.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <Repeat className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                لا توجد طلبات متكررة
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                اختر تكرار الطلب عند إنشاء خدمة جديدة لتفعيل الجدولة التلقائية.
              </p>
              <button
                type="button"
                onClick={onNewRequest}
                className="mt-2 px-5 py-2.5 min-h-[44px] bg-[#FF5A00] text-white text-xs font-semibold rounded-xl hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 transition-colors cursor-pointer"
              >
                إنشاء طلب متكرر الآن
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleSchedules.map((sched) => (
                <article
                  key={sched.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-orange-700 dark:text-orange-400 inline-flex items-center gap-1">
                          <Repeat className="w-3.5 h-3.5" />
                          <span>يتكرر {getRecurrenceLabel(sched.frequency)}</span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{sched.categoryName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          {sched.generatedCount} {sched.generatedCount === 1 ? 'دورة منشأة' : 'دورات منشأة'}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {sched.serviceTitle}
                      </h2>
                    </div>

                    <span
                      className={`text-xs font-bold shrink-0 ${
                        sched.status === 'active'
                          ? 'text-orange-700 dark:text-orange-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {sched.status === 'active' ? 'نشط ومجدول' : 'متوقف مؤقتاً'}
                    </span>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {sched.detailedDescription}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      {sched.district} — {sched.addressText}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      {sched.preferredTime}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-medium">
                      {sched.paymentMethod === 'wallet' ? (
                        <Wallet className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400" />
                      ) : (
                        <Banknote className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400" />
                      )}
                      <span>
                        {getPaymentMethodLabel(sched.paymentMethod, sched.walletProvider)}
                      </span>
                    </span>
                  </div>

                  {/* Schedule Next Run & Last Run */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">الموعد التلقائي القادم</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5 block">
                        {sched.status === 'active'
                          ? formatArabicDateLabel(sched.nextRunDateISO)
                          : 'متوقف مؤقتاً'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">آخر إنشاء تلقائي</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums mt-0.5 block">
                        {sched.lastRunDateISO
                          ? formatArabicDateLabel(sched.lastRunDateISO)
                          : 'لم يبدأ بعد (بانتظار تاريخ البدء)'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-2">
                      {sched.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => {
                            const result = onTriggerRecurringNow(sched.id);
                            if (result) {
                              setTriggerFeedback({
                                serviceTitle: sched.serviceTitle,
                                referenceCode: result.referenceCode,
                                notifiedCount: result.notifiedCount,
                              });
                            }
                          }}
                          className="min-h-[44px] px-4 py-2 text-xs font-bold text-white bg-[#FF5A00] hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Repeat className="w-3.5 h-3.5" />
                          <span>إنشاء الدورة التالية الآن (تجربة)</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onToggleRecurringStatus(sched.id)}
                        className="min-h-[44px] px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {sched.status === 'active' ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>إيقاف مؤقت</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400" />
                            <span>استئناف التكرار</span>
                          </>
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCancelScheduleId(sched.id)}
                      className="min-h-[44px] px-3.5 py-2 text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>إلغاء التكرار</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : currentList.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
            لا توجد طلبات هنا حالياً
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            اطلب خدمة جديدة لاستقبال عروض الفنيين خلال 30 دقيقة.
          </p>
          <button
            type="button"
            onClick={onNewRequest}
            className="mt-2 px-5 py-2.5 min-h-[44px] bg-[#FF5A00] text-white text-xs font-semibold rounded-xl hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 transition-colors cursor-pointer"
          >
            إنشاء طلب خدمة الآن
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {currentList.map((req) => {
            const reqQuotes = quotes.filter((q) => q.requestId === req.id);
            const acceptedQuote = reqQuotes.find(
              (q) => q.id === req.acceptedQuoteId || q.status === 'accepted'
            );
            const savingsSummary =
              req.status !== 'cancelled'
                ? computeRequestCostSavingsSummary(
                    req,
                    reqQuotes,
                    quotes,
                    requests,
                    reviews
                  )
                : null;
            const fastWindow =
              req.status === 'open_for_quotes'
                ? getFastQuoteWindowStatus(
                    req.createdAtTimestamp,
                    reqQuotes.length,
                    nowMs
                  )
                : null;
            const stageIdx = getTrackingStageIndex(req.status);

            return (
              <article
                key={req.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 space-y-5"
              >
                {/* Request Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                        #{req.referenceCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{req.categoryName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{req.createdAt}</span>
                      {req.urgency === 'urgent' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-bold text-amber-700 dark:text-amber-400">
                            طلب طوارئ سريع
                          </span>
                        </>
                      )}
                      {(req.promoCode || (req.loyaltyDiscountEGP && req.loyaltyDiscountEGP > 0)) && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                            <Tag className="w-3 h-3" />
                            <span>
                              {req.promoCode ? `كود ${req.promoCode} (${req.discountPercent}%)` : ''}
                              {req.promoCode && req.loyaltyDiscountEGP ? ' + ' : ''}
                              {req.loyaltyDiscountEGP ? `نقاط خدمات -${req.loyaltyDiscountEGP} ج.م` : ''}
                            </span>
                          </span>
                        </>
                      )}
                      {req.bundleTitle && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-orange-700 dark:text-orange-400">
                            <Sparkles className="w-3 h-3" />
                            <span>{req.bundleTitle}</span>
                          </span>
                        </>
                      )}
                      {req.recurrenceFrequency && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-orange-700 dark:text-orange-400">
                            <Repeat className="w-3 h-3" />
                            <span>
                              طلب متكرر ({getRecurrenceLabel(req.recurrenceFrequency)}
                              {req.recurrenceCycleNumber
                                ? ` · دورة #${req.recurrenceCycleNumber}`
                                : ''}
                              )
                            </span>
                          </span>
                        </>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{req.serviceTitle}</h2>
                    {req.isWarrantyClaim && req.warrantyClaimForRef && (
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          طلب إعادة فحص ضمان مجاني · WR-{req.warrantyClaimForRef}
                        </span>
                      </div>
                    )}
                  </div>

                  <span
                    className={`text-xs font-semibold shrink-0 ${
                      req.status === 'open_for_quotes' || req.status === 'en_route'
                        ? 'text-orange-700 dark:text-orange-400'
                        : req.status === 'cancelled'
                        ? 'text-red-700 dark:text-red-400'
                        : req.status === 'completed'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {req.status === 'open_for_quotes' &&
                      `متاح للعروض (${reqQuotes.length} ${reqQuotes.length === 1 ? 'عرض' : 'عروض'})`}
                    {req.status === 'quote_accepted' && 'تمت الموافقة · الفني يستعد للتحرك'}
                    {req.status === 'en_route' && 'الفني في الطريق إليك الآن'}
                    {req.status === 'in_progress' && 'الفني يعمل على تنفيذ الخدمة'}
                    {req.status === 'completed' && 'مكتمل'}
                    {req.status === 'cancelled' && 'ملغي'}
                  </span>
                </div>

                {/* Live Tracking Stepper (Non-cancelled requests) */}
                {req.status !== 'cancelled' && (
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-slate-900 dark:text-slate-100 inline-flex items-center gap-1.5">
                        {req.status === 'en_route' ? (
                          <Navigation className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400" />
                        ) : req.status === 'in_progress' ? (
                          <Wrench className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400" />
                        )}
                        <span>تتبع حالة الطلب لحظياً</span>
                      </span>
                      <span className="text-[11px] font-semibold text-orange-700 dark:text-orange-400">
                        المرحلة {stageIdx + 1} من {TRACKING_STAGES.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5">
                      {TRACKING_STAGES.map((st, idx) => {
                        const isDone = idx < stageIdx || req.status === 'completed';
                        const isCurrent = idx === stageIdx && req.status !== 'completed';
                        return (
                          <div key={st.id} className="space-y-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-colors ${
                                isCurrent
                                  ? 'bg-[#FF5A00] dark:bg-orange-500'
                                  : isDone
                                  ? 'bg-emerald-600 dark:bg-emerald-500'
                                  : 'bg-slate-200 dark:bg-slate-700'
                              }`}
                            />
                            <div
                              className={`text-[10px] sm:text-[11px] leading-tight text-center ${
                                isCurrent
                                  ? 'font-bold text-orange-700 dark:text-orange-400'
                                  : isDone
                                  ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                                  : 'text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {st.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Symbolic Live Technician Route Map (Immediately visible when en_route) */}
                {req.status === 'en_route' && acceptedQuote && (
                  <LiveTechnicianRouteMap
                    request={req}
                    quote={acceptedQuote}
                    technicians={technicians}
                    isDark={isDark}
                  />
                )}

                {/* 30-Minute Fast Quote Response Indicator */}
                {fastWindow && (
                  <div className="bg-orange-50/75 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#FF5A00] dark:bg-orange-600 text-white flex items-center justify-center shrink-0">
                        <Timer className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-orange-950 dark:text-orange-100">
                          مؤشر سرعة العروض خلال {FAST_QUOTE_WINDOW_MINUTES} دقيقة
                        </div>
                        <p className="text-xs text-orange-800 dark:text-orange-300 tabular-nums">
                          {fastWindow.headline} ·{' '}
                          {reqQuotes.length > 0
                            ? `وصلتك ${reqQuotes.length} عروض أسعار حتى الآن`
                            : 'تم بث الطلب لأقرب الفنيين وبانتظار أول عرض'}
                        </p>
                      </div>
                    </div>

                    <div className="w-full sm:w-44 space-y-1 shrink-0">
                      <div className="flex items-center justify-between text-[11px] font-bold text-orange-800 dark:text-orange-300 tabular-nums">
                        <span>المنقضي {fastWindow.elapsedMinutes} د</span>
                        <span>{FAST_QUOTE_WINDOW_MINUTES} د</span>
                      </div>
                      <div className="h-2 rounded-full bg-orange-200/80 dark:bg-orange-900/60 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#FF5A00] dark:bg-orange-500 transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                12,
                                Math.round(
                                  ((FAST_QUOTE_WINDOW_MINUTES - fastWindow.remainingMinutes) /
                                    FAST_QUOTE_WINDOW_MINUTES) *
                                    100
                                )
                              )
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Request Details & Fault Photos */}
                <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                  <p className="leading-relaxed">{req.detailedDescription}</p>

                  {req.faultPhotos && req.faultPhotos.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400" />
                        <span className="tabular-nums">صور العطل المرفقة ({req.faultPhotos.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {req.faultPhotos.map((photoSrc, idx) => (
                          <button
                            key={`${req.id}-photo-${idx}`}
                            type="button"
                            onClick={() => setPreviewPhotoUrl(photoSrc)}
                            className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-[#FF5A00] dark:hover:border-orange-500 transition-colors cursor-pointer shrink-0"
                            aria-label={`عرض صورة العطل ${idx + 1}`}
                          >
                            <img
                              src={photoSrc}
                              alt={`صورة العطل ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      {req.district} — {req.addressText}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      {req.preferredDate} · {req.preferredTime}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-medium">
                      {req.paymentMethod === 'wallet' ? (
                        <Wallet className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400" />
                      ) : (
                        <Banknote className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400" />
                      )}
                      <span>
                        طريقة الدفع:{' '}
                        {getPaymentMethodLabel(req.paymentMethod, req.walletProvider)}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Request-Level Cost Saving Indicator («مؤشر توفير التكلفة») */}
                {savingsSummary && savingsSummary.marketAverageEGP !== null && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300/80 dark:border-emerald-700/70 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-700 dark:bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <TrendingDown className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-xs font-extrabold text-emerald-950 dark:text-emerald-100">
                          مؤشر توفير التكلفة
                        </div>
                        <p className="text-xs font-medium text-emerald-900 dark:text-emerald-200 leading-snug">
                          {savingsSummary.mode === 'accepted_offer' ? (
                            savingsSummary.expectedSavingsPercent > 0 ? (
                              <>
                                وفرت{' '}
                                <span className="font-extrabold tabular-nums">
                                  {savingsSummary.expectedSavingsPercent}%
                                </span>{' '}
                                ({formatEGP(savingsSummary.expectedSavingsAmountEGP)}) مقارنة بمتوسط عروض الفنيين السابقين
                              </>
                            ) : (
                              <>
                                السعر المتفق عليه ضمن متوسط عروض الفنيين السابقين للخدمة
                              </>
                            )
                          ) : savingsSummary.mode === 'live_best_offer' ? (
                            savingsSummary.expectedSavingsPercent > 0 ? (
                              <>
                                نسبة التوفير المتوقعة عند اختيار أقل عرض:{' '}
                                <span className="font-extrabold tabular-nums">
                                  {savingsSummary.expectedSavingsPercent}%
                                </span>{' '}
                                (توفر {formatEGP(savingsSummary.expectedSavingsAmountEGP)})
                              </>
                            ) : (
                              <>
                                أقل عرض مقدم ({formatEGP(savingsSummary.bestOfferEGP || 0)}) يقارب متوسط العروض السابقة
                              </>
                            )
                          ) : savingsSummary.expectedSavingsPercent > 0 ? (
                            <>
                              نسبة التوفير المتوقعة تصل إلى{' '}
                              <span className="font-extrabold tabular-nums">
                                {savingsSummary.expectedSavingsPercent}%
                              </span>{' '}
                              بناءً على مقارنة عروض الفنيين السابقين لنفس الخدمة
                            </>
                          ) : (
                            <>
                              متوسط عروض الفنيين السابقين للخدمة:{' '}
                              <span className="font-extrabold tabular-nums">
                                {formatEGP(savingsSummary.marketAverageEGP)}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-emerald-200/80 dark:border-emerald-800/70">
                      <div className="flex items-center gap-2">
                        {savingsSummary.bestOfferEGP !== null && (
                          <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                            {formatEGP(savingsSummary.bestOfferEGP)}
                          </span>
                        )}
                        {savingsSummary.expectedSavingsPercent > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 dark:bg-emerald-600 text-white px-2.5 py-1 text-xs font-extrabold tabular-nums">
                            توفير {savingsSummary.expectedSavingsPercent}%
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 tabular-nums">
                        متوسط {savingsSummary.previousQuotesCount} عرض سابق:{' '}
                        {formatEGP(savingsSummary.marketAverageEGP)}
                      </div>
                    </div>
                  </div>
                )}



                {/* Open Request: Incoming Quotes List */}
                {req.status === 'open_for_quotes' && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        العروض المقدمة من الفنيين والشركات ({reqQuotes.length})
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        رقمك مخفي حتى تضغط موافق
                      </span>
                    </div>

                    {reqQuotes.length === 0 ? (
                      <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-5 text-center space-y-1.5">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {req.routingInfo?.matchType === 'nearest_center'
                            ? `تم التوجيه للأقرب في ${req.routingInfo.nearestCenterName} (~${req.routingInfo.distanceKm} كم)`
                            : `تم تنبيه ${req.routingInfo?.notifiedCount || ''} فنيين في ${req.categoryName}`}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          ستظهر العروض هنا فور إرسالها.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {reqQuotes.length >= 2 && (
                          <SmartQuoteComparisonStrip
                            request={req}
                            quotes={reqQuotes}
                            allQuotes={quotes}
                            allRequests={requests}
                            reviews={reviews}
                            onHighlightQuote={setHighlightedQuoteId}
                            onSelectQuoteForAccept={(q) => {
                              setConfirmingOrder({ request: req, quote: q });
                              setConfirmPaymentMethod(req.paymentMethod || 'cash');
                              setConfirmWalletProvider(
                                req.walletProvider || WALLET_PROVIDERS[0]
                              );
                            }}
                          />
                        )}
                        {reqQuotes.map((quote) => {
                          const techStats = computeTechnicianStats(
                            quote.technicianId,
                            reviews,
                            quotes,
                            requests
                          );
                          const displayAvg =
                            techStats.totalReviews > 0
                              ? techStats.averageRating.toFixed(1)
                              : quote.technicianRating.toFixed(1);
                          const chatKey = `${req.id}:${quote.technicianId}`;
                          const threadMessages = messages.filter(
                            (m) =>
                              m.requestId === req.id &&
                              m.technicianId === quote.technicianId
                          );
                          const isChatOpen = openChatKey === chatKey;
                          const quoteComparison = computeQuoteMarketComparison(
                            quote.priceEGP,
                            req.serviceTitle,
                            req.id,
                            quotes,
                            requests,
                            reviews
                          );
                          const promoBreakdown = computeDiscountedPrice(
                            quote.priceEGP,
                            req.discountPercent,
                            req.maxDiscountEGP,
                            req.loyaltyDiscountEGP || 0
                          );

                          const isHighlighted = highlightedQuoteId === quote.id;

                          return (
                            <div
                              key={quote.id}
                              onMouseEnter={() => setHighlightedQuoteId(quote.id)}
                              onMouseLeave={() => setHighlightedQuoteId(null)}
                              className={`border rounded-xl p-4 space-y-3 transition-colors ${
                                isHighlighted
                                  ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 ring-1 ring-emerald-500/40'
                                  : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50'
                              }`}
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-2 flex-1 min-w-0">
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                                      {quote.isCompany && (
                                        <Building2 className="w-4 h-4 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                                      )}
                                      {quote.technicianName}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => onViewTechnicianStats(quote.technicianId)}
                                      className="text-xs text-orange-700 dark:text-orange-400 hover:underline font-semibold inline-flex items-center gap-1 tabular-nums cursor-pointer"
                                    >
                                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                      <span>
                                        {displayAvg} ({techStats.totalReviews} تقييم)
                                      </span>
                                      <span>·</span>
                                      <span>عرض سجل التقييمات</span>
                                    </button>
                                  </div>

                                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                    {quote.notes}
                                  </p>

                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="inline-flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5" />
                                      {quote.estimatedArrival}
                                    </span>
                                    {quote.warrantyLabel && (
                                      <>
                                        <span>·</span>
                                        <span className="inline-flex items-center gap-1 text-orange-700 dark:text-orange-400 font-medium">
                                          <ShieldCheck className="w-3.5 h-3.5" />
                                          {quote.warrantyLabel}
                                        </span>
                                      </>
                                    )}
                                    <span>·</span>
                                    <span>{quote.createdAt}</span>
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end justify-between gap-2.5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-700 shrink-0">
                                  {/* Price + Bold High-Contrast Cost Saving Indicator Side-by-Side */}
                                  <div className="flex items-center justify-between md:justify-end gap-2.5 flex-wrap">
                                    <div className="text-right md:text-left">
                                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                                        {promoBreakdown.promoDiscountEGP > 0
                                          ? req.promoCode && req.loyaltyDiscountEGP
                                            ? `بعد كود ${req.promoCode} ونقاط خدمات`
                                            : req.loyaltyDiscountEGP
                                            ? `بعد خصم نقاط خدمات (-${req.loyaltyDiscountEGP} ج.م)`
                                            : `بعد خصم ${req.promoCode}`
                                          : 'السعر المقدم'}
                                      </span>
                                      <div className="flex items-baseline gap-2 justify-end">
                                        {promoBreakdown.promoDiscountEGP > 0 && (
                                          <span className="text-xs line-through text-slate-400 dark:text-slate-500 tabular-nums">
                                            {formatEGP(quote.priceEGP)}
                                          </span>
                                        )}
                                        <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                                          {formatEGP(promoBreakdown.finalPriceEGP)}
                                        </span>
                                      </div>
                                    </div>

                                    {quoteComparison.marketAverageEGP !== null &&
                                      (quoteComparison.savingsPercent >= 1 ? (
                                        <div className="bg-emerald-100/90 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/80 text-emerald-950 dark:text-emerald-100 rounded-xl px-3 py-2 text-right space-y-0.5">
                                          <div className="flex items-center gap-1 text-xs font-extrabold text-emerald-900 dark:text-emerald-200 tabular-nums">
                                            <TrendingDown
                                              className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0"
                                              aria-hidden="true"
                                            />
                                            <span>
                                              وفر {quoteComparison.savingsPercent}%
                                            </span>
                                          </div>
                                          <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 tabular-nums">
                                            أقل بـ {formatEGP(quoteComparison.savingsAmountEGP)} من المتوسط
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-2.5 py-1.5 text-[11px] font-bold tabular-nums">
                                          متوسط السوق {formatEGP(quoteComparison.marketAverageEGP)}
                                        </div>
                                      ))}
                                  </div>

                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenChatKey(isChatOpen ? null : chatKey);
                                        setChatInput('');
                                      }}
                                      className={`px-3.5 py-2.5 min-h-[44px] text-xs font-semibold rounded-xl border transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                                        isChatOpen
                                          ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-700 dark:border-slate-600'
                                          : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#FF5A00] dark:hover:border-orange-500'
                                      }`}
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                      <span>
                                        محادثة
                                        {threadMessages.length > 0
                                          ? ` (${threadMessages.length})`
                                          : ''}
                                      </span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setConfirmingOrder({ request: req, quote });
                                        setConfirmPaymentMethod(req.paymentMethod || 'cash');
                                        setConfirmWalletProvider(
                                          req.walletProvider || WALLET_PROVIDERS[0]
                                        );
                                      }}
                                      className="px-5 py-2.5 min-h-[44px] bg-[#FF5A00] text-white text-xs font-bold rounded-xl hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <Check className="w-4 h-4" />
                                      <span>موافق</span>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Pre-acceptance In-App Chat Drawer */}
                              {isChatOpen && (
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-3">
                                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                      استفسار مباشر قبل الموافقة مع {quote.technicianName}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-orange-700 dark:text-orange-400">
                                      <Lock className="w-3 h-3" />
                                      رقمك محمي
                                    </span>
                                  </div>

                                  {threadMessages.length === 0 ? (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 py-2 text-center">
                                      اسأل الفني عن تفاصيل التنفيذ أو القطع قبل الضغط على موافق.
                                    </p>
                                  ) : (
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                      {threadMessages.map((msg) => (
                                        <div
                                          key={msg.id}
                                          className={`flex flex-col ${
                                            msg.senderRole === 'customer'
                                              ? 'items-start'
                                              : 'items-end'
                                          }`}
                                        >
                                          <div
                                            className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                                              msg.senderRole === 'customer'
                                                ? 'bg-[#FF5A00] dark:bg-orange-600 text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                                            }`}
                                          >
                                            {msg.text}
                                          </div>
                                          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 px-1">
                                            {msg.senderRole === 'customer'
                                              ? 'أنت'
                                              : quote.technicianName}{' '}
                                            · {msg.createdAt}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <form
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      if (!chatInput.trim()) return;
                                      onSendMessage(
                                        req.id,
                                        quote.technicianId,
                                        quote.technicianName,
                                        'customer',
                                        chatInput
                                      );
                                      setChatInput('');
                                    }}
                                    className="flex items-center gap-2 pt-1"
                                  >
                                    <input
                                      type="text"
                                      value={chatInput}
                                      onChange={(e) => setChatInput(e.target.value)}
                                      placeholder="اكتب سؤالك للفني..."
                                      className="flex-1 h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none"
                                    />
                                    <button
                                      type="submit"
                                      className="min-h-[40px] px-4 bg-[#FF5A00] text-white text-xs font-semibold rounded-xl hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <Send className="w-3.5 h-3.5" />
                                      <span>إرسال</span>
                                    </button>
                                  </form>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setCancelConfirmId(req.id)}
                        className="text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 px-3 py-2 rounded-xl cursor-pointer"
                      >
                        إلغاء الطلب
                      </button>
                    </div>
                  </div>
                )}

                {/* Accepted / En-route / In-Progress / Completed Quote Details */}
                {req.status !== 'open_for_quotes' &&
                  req.status !== 'cancelled' &&
                  acceptedQuote && (() => {
                    const acceptedPromo = computeDiscountedPrice(
                      acceptedQuote.priceEGP,
                      req.discountPercent,
                      req.maxDiscountEGP,
                      req.loyaltyDiscountEGP || 0
                    );
                    return (
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                        <div className="bg-orange-50/60 dark:bg-orange-950/35 border border-orange-200/80 dark:border-orange-800/70 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="text-xs text-orange-700 dark:text-orange-400 font-semibold flex items-center gap-1.5">
                              {req.status === 'en_route' ? (
                                <>
                                  <Navigation className="w-4 h-4" />
                                  <span>الفني في الطريق إليك الآن</span>
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="w-4 h-4" />
                                  <span>الفني المختار للخدمة</span>
                                </>
                              )}
                            </div>
                            <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                              {acceptedQuote.technicianName}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">
                              الموعد المتفق عليه: {acceptedQuote.estimatedArrival}
                            </div>
                            <div className="text-xs text-slate-800 dark:text-slate-200 font-medium flex items-center gap-1.5 pt-0.5">
                              {req.paymentMethod === 'wallet' ? (
                                <Wallet className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                              ) : (
                                <Banknote className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                              )}
                              <span>
                                طريقة الدفع:{' '}
                                {getPaymentMethodLabel(req.paymentMethod, req.walletProvider)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-wrap justify-end">
                            <div className="text-right sm:text-left">
                              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                                {acceptedPromo.promoDiscountEGP > 0
                                  ? req.loyaltyDiscountEGP
                                    ? 'الإجمالي بعد الخصم ونقاط خدمات'
                                    : `الإجمالي بعد خصم ${req.promoCode}`
                                  : 'السعر المتفق عليه'}
                              </span>
                              <div className="flex items-baseline gap-2 justify-end">
                                {acceptedPromo.promoDiscountEGP > 0 && (
                                  <span className="text-xs line-through text-slate-400 dark:text-slate-500 tabular-nums">
                                    {formatEGP(acceptedQuote.priceEGP)}
                                  </span>
                                )}
                                <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                                  {formatEGP(acceptedPromo.finalPriceEGP)}
                                </span>
                              </div>
                            </div>
                            {savingsSummary && savingsSummary.expectedSavingsPercent > 0 && (
                              <div className="bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/80 text-emerald-950 dark:text-emerald-100 rounded-xl px-3 py-2 text-right space-y-0.5">
                                <div className="flex items-center gap-1 text-xs font-extrabold text-emerald-900 dark:text-emerald-200 tabular-nums">
                                  <TrendingDown className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                                  <span>وفر {savingsSummary.expectedSavingsPercent}%</span>
                                </div>
                                <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 tabular-nums">
                                  {formatEGP(savingsSummary.expectedSavingsAmountEGP)} عن المتوسط
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Contact & Completion Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <a
                              href={`tel:${acceptedQuote.technicianPhone}`}
                              className="inline-flex items-center gap-1.5 min-h-[42px] px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            >
                              <Phone className="w-4 h-4 text-[#FF5A00] dark:text-orange-400" />
                              <span className="tabular-nums">
                                اتصال ({acceptedQuote.technicianPhone})
                              </span>
                            </a>

                            <a
                              href={buildWhatsAppLink(
                                acceptedQuote.technicianPhone,
                                `أهلاً ${acceptedQuote.technicianName}، بخصوص طلب #${req.referenceCode} (${req.serviceTitle}) على تطبيق خدمات.`
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 min-h-[42px] px-4 py-2 text-xs font-semibold text-orange-800 dark:text-orange-200 bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-100 dark:hover:bg-orange-900/60 rounded-xl transition-colors"
                            >
                              <MessageCircle className="w-4 h-4 text-[#FF5A00] dark:text-orange-400" />
                              <span>واتساب</span>
                            </a>
                          </div>

                          {(req.status === 'quote_accepted' ||
                            req.status === 'en_route' ||
                            req.status === 'in_progress' ||
                            (req.status === 'completed' && !req.rating)) && (
                            <button
                              type="button"
                              onClick={() => {
                                setRatingRequestId(req.id);
                                setRatingValue(5);
                                setReviewText('');
                              }}
                              className="inline-flex items-center gap-1.5 min-h-[42px] px-5 py-2 text-xs font-semibold text-white bg-[#FF5A00] hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 rounded-xl transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>
                                {req.status === 'completed'
                                  ? 'تقييم الفني الآن'
                                  : 'تأكيد الانتهاء وتقييم الفني'}
                              </span>
                            </button>
                          )}
                        </div>

                        {/* Display Rating if already rated */}
                        {req.rating && (
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="flex flex-wrap items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
                              <span>تقييمك للفني:</span>
                              <span className="inline-flex items-center gap-0.5 text-amber-500">
                                {Array.from({ length: req.rating }).map((_, idx) => (
                                  <Star key={idx} className="w-3.5 h-3.5 fill-amber-500" />
                                ))}
                              </span>
                              {req.review && (
                                <span className="text-slate-600 dark:text-slate-400 font-normal">
                                  «{req.review}»
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setCompletedOrderSummary({
                                  request: req,
                                  quote: acceptedQuote,
                                  rating: req.rating || 5,
                                  review: req.review || '',
                                  savingsPercent:
                                    savingsSummary?.expectedSavingsPercent || 0,
                                  savingsAmountEGP:
                                    savingsSummary?.expectedSavingsAmountEGP || 0,
                                })
                              }
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-700 dark:text-orange-400 hover:underline self-start sm:self-auto shrink-0 cursor-pointer"
                            >
                              <Award className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>عرض شارة الإنجاز والملخص</span>
                            </button>
                          </div>
                        )}
                        {/* Digital Warranty Pass («جواز الضمان الرقمي») for completed jobs */}
                        {req.status === 'completed' && !req.isWarrantyClaim && (
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                            <DigitalWarrantyCard
                              request={req}
                              quote={acceptedQuote}
                              existingClaimRequest={requests.find(
                                (r) => r.warrantyClaimForRef === req.referenceCode
                              )}
                              onRequestWarrantyCheck={onRequestWarrantyCheck}
                              onJumpToClaims={() => setTab('open')}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })()}
              </article>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">تأكيد إلغاء الطلب</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              هل تريد إلغاء هذا الطلب وإيقاف استقبال العروض عليه؟
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelConfirmId(null)}
                className="px-4 py-2.5 min-h-[44px] text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={() => {
                  onCancelRequest(cancelConfirmId);
                  setCancelConfirmId(null);
                }}
                className="px-5 py-2.5 min-h-[44px] text-xs font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 cursor-pointer"
              >
                تأكيد الإلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rate Technician Modal */}
      {ratingRequestId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">تقييم الفني</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              أضف تقييمك لمساعدة عملاء الدقهلية
            </p>
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingValue(star)}
                  aria-label={`${star} نجوم`}
                  className="p-1.5 cursor-pointer"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= ratingValue
                        ? 'fill-amber-500 text-amber-500'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="اكتب رأيك في التزام الفني وجودة الشغل والسعر..."
              className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRatingRequestId(null)}
                className="px-4 py-2.5 min-h-[44px] text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetReq = requests.find((r) => r.id === ratingRequestId);
                  const targetQuotes = quotes.filter(
                    (q) => q.requestId === ratingRequestId
                  );
                  const targetAcceptedQuote = targetQuotes.find(
                    (q) =>
                      q.id === targetReq?.acceptedQuoteId ||
                      q.status === 'accepted'
                  );
                  const targetSavings = targetReq
                    ? computeRequestCostSavingsSummary(
                        targetReq,
                        targetQuotes,
                        quotes,
                        requests,
                        reviews
                      )
                    : null;
                  const cleanReview = reviewText.trim();

                  onRateTechnician(ratingRequestId, ratingValue, cleanReview);
                  setRatingRequestId(null);
                  setTab('history');

                  if (targetReq) {
                    setCompletedOrderSummary({
                      request: {
                        ...targetReq,
                        status: 'completed',
                        rating: ratingValue,
                        review: cleanReview || undefined,
                      },
                      quote: targetAcceptedQuote,
                      rating: ratingValue,
                      review: cleanReview,
                      savingsPercent: targetSavings?.expectedSavingsPercent || 0,
                      savingsAmountEGP:
                        targetSavings?.expectedSavingsAmountEGP || 0,
                    });
                  }
                }}
                className="px-5 py-2.5 min-h-[44px] text-xs font-semibold text-white bg-[#FF5A00] rounded-xl hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 cursor-pointer"
              >
                تأكيد الإتمام وحفظ التقييم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order & Payment Confirmation Modal when accepting a quote */}
      {confirmingOrder && (() => {
        const promoSummary = computeDiscountedPrice(
          confirmingOrder.quote.priceEGP,
          confirmingOrder.request.discountPercent,
          confirmingOrder.request.maxDiscountEGP,
          confirmingOrder.request.loyaltyDiscountEGP || 0
        );
        return (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/65 backdrop-blur-sm p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-order-modal-title"
          >
            <div className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="sm:hidden w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-1" />

              <div className="space-y-1">
                <div className="text-xs text-orange-700 dark:text-orange-400 font-semibold tabular-nums">
                  تأكيد الطلب #{confirmingOrder.request.referenceCode}
                </div>
                <h3
                  id="confirm-order-modal-title"
                  className="text-lg font-bold text-slate-900 dark:text-slate-100"
                >
                  مراجعة وتأكيد طريقة الدفع والموافقة على العرض
                </h3>
              </div>

              {/* Quote Summary */}
              <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-400">الخدمة:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-left">
                    {confirmingOrder.request.serviceTitle}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-400">الفني / الشركة:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {confirmingOrder.quote.technicianName}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-400">موعد التنفيذ:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {confirmingOrder.quote.estimatedArrival}
                  </span>
                </div>
                {promoSummary.promoDiscountEGP > 0 && (
                  <>
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <span className="text-slate-500 dark:text-slate-400">السعر قبل الخصم:</span>
                      <span className="text-slate-600 dark:text-slate-300 line-through tabular-nums">
                        {formatEGP(confirmingOrder.quote.priceEGP)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-emerald-700 dark:text-emerald-400 font-semibold">
                      <span className="inline-flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {confirmingOrder.request.promoCode && confirmingOrder.request.loyaltyDiscountEGP
                            ? `خصم ${confirmingOrder.request.promoCode} + نقاط خدمات:`
                            : confirmingOrder.request.loyaltyDiscountEGP
                            ? 'خصم نقاط خدمات:'
                            : `خصم كود ${confirmingOrder.request.promoCode}:`}
                        </span>
                      </span>
                      <span className="tabular-nums">- {formatEGP(promoSummary.promoDiscountEGP)}</span>
                    </div>
                  </>
                )}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {promoSummary.promoDiscountEGP > 0 ? 'الصافي بعد الخصم:' : 'الإجمالي المتفق عليه:'}
                  </span>
                  <span className="text-lg font-bold text-orange-700 dark:text-orange-400 tabular-nums">
                    {formatEGP(promoSummary.finalPriceEGP)}
                  </span>
                </div>
                {(() => {
                  const cmp = computeQuoteMarketComparison(
                    confirmingOrder.quote.priceEGP,
                    confirmingOrder.request.serviceTitle,
                    confirmingOrder.request.id,
                    quotes,
                    requests,
                    reviews
                  );
                  if (cmp.savingsPercent >= 1 && cmp.marketAverageEGP !== null) {
                    return (
                      <div className="flex items-center justify-between gap-3 text-emerald-800 dark:text-emerald-300 font-semibold pt-1">
                        <span className="inline-flex items-center gap-1">
                          <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                          <span>نسبة التوفير المتوقعة:</span>
                        </span>
                        <span className="tabular-nums">
                          {cmp.savingsPercent}% ({formatEGP(cmp.savingsAmountEGP)})
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Payment Method Choice */}
              <div className="space-y-2.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  تأكيد طريقة الدفع للطلب:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setConfirmPaymentMethod('cash')}
                    aria-pressed={confirmPaymentMethod === 'cash'}
                    className={`min-h-[54px] p-3 rounded-xl border text-right flex items-start gap-2.5 transition-colors cursor-pointer ${
                      confirmPaymentMethod === 'cash'
                        ? 'border-[#FF5A00] dark:border-orange-500 bg-orange-50/75 dark:bg-orange-950/60 text-orange-950 dark:text-orange-100'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <Banknote
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        confirmPaymentMethod === 'cash' ? 'text-[#FF5A00] dark:text-orange-400' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold flex items-center justify-between gap-1">
                        <span>نقد عند الاستلام</span>
                        {confirmPaymentMethod === 'cash' && (
                          <Check className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        الدفع نقداً بعد إتمام الخدمة
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmPaymentMethod('wallet')}
                    aria-pressed={confirmPaymentMethod === 'wallet'}
                    className={`min-h-[54px] p-3 rounded-xl border text-right flex items-start gap-2.5 transition-colors cursor-pointer ${
                      confirmPaymentMethod === 'wallet'
                        ? 'border-[#FF5A00] dark:border-orange-500 bg-orange-50/75 dark:bg-orange-950/60 text-orange-950 dark:text-orange-100'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <Wallet
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        confirmPaymentMethod === 'wallet' ? 'text-[#FF5A00] dark:text-orange-400' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold flex items-center justify-between gap-1">
                        <span>محفظة إلكترونية</span>
                        {confirmPaymentMethod === 'wallet' && (
                          <Check className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        فودافون كاش / إنستاباي / أورنج
                      </p>
                    </div>
                  </button>
                </div>

                {confirmPaymentMethod === 'wallet' && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {WALLET_PROVIDERS.map((provider) => (
                      <button
                        key={provider}
                        type="button"
                        onClick={() => setConfirmWalletProvider(provider)}
                        className={`min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          confirmWalletProvider === provider
                            ? 'bg-[#FF5A00] text-white border-[#FF5A00] dark:bg-orange-600 dark:border-orange-600'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        {provider}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setConfirmingOrder(null)}
                  className="px-4 py-2.5 min-h-[44px] text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
                >
                  تراجع
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAcceptQuote(
                      confirmingOrder.request.id,
                      confirmingOrder.quote.id,
                      confirmPaymentMethod,
                      confirmPaymentMethod === 'wallet' ? confirmWalletProvider : undefined
                    );
                    setConfirmingOrder(null);
                    setTab('active');
                  }}
                  className="px-5 py-2.5 min-h-[44px] text-xs font-bold text-white bg-[#FF5A00] hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>تأكيد الطلب والموافقة</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Cancel Recurring Schedule Modal */}
      {cancelScheduleId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              تأكيد إلغاء تكرار الطلب
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              سيتم إيقاف إنشاء الطلبات التلقائية لهذا الجدول.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelScheduleId(null)}
                className="px-4 py-2.5 min-h-[44px] text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={() => {
                  onCancelRecurringSchedule(cancelScheduleId);
                  setCancelScheduleId(null);
                }}
                className="px-5 py-2.5 min-h-[44px] text-xs font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 cursor-pointer"
              >
                تأكيد الإلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fault Photo Lightbox Modal */}
      {previewPhotoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewPhotoUrl(null)}
              aria-label="إغلاق الصورة"
              className="absolute top-3 left-3 z-10 min-w-[44px] min-h-[44px] rounded-xl bg-slate-950/80 text-white flex items-center justify-center hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewPhotoUrl}
              alt="معاينة صورة العطل"
              className="w-full max-h-[82vh] object-contain bg-slate-950"
            />
          </div>
        </div>
      )}

      <OrderCompletionModal
        summary={completedOrderSummary}
        onClose={() => setCompletedOrderSummary(null)}
        onNewRequest={onNewRequest}
      />
    </div>
  );
}
