import {
  Award,
  Banknote,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  LocateFixed,
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
  Star,
  Tag,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  WALLET_PROVIDERS,
  buildWhatsAppLink,
  computeDiscountedPrice,
  computeQuoteMarketComparison,
  computeRequestCostSavingsSummary,
  computeTechnicianStats,
  formatArabicDateLabel,
  formatEGP,
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
import { DigitalWarrantyCard } from './DigitalWarrantyCard';
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
  { id: 'open_for_quotes', label: 'العروض' },
  { id: 'quote_accepted', label: 'تأكيد' },
  { id: 'en_route', label: 'في الطريق' },
  { id: 'in_progress', label: 'تنفيذ' },
  { id: 'completed', label: 'مكتمل' },
];

function getTrackingStageIndex(status: ServiceRequestStatus): number {
  const idx = TRACKING_STAGES.findIndex((s) => s.id === status);
  return idx >= 0 ? idx : 0;
}

function extractMapsUrl(text: string): string | null {
  const match = text.match(/https?:\/\/(?:www\.)?(?:maps\.google\.com|goo\.gl\/maps|maps\.app\.goo\.gl)\S*/i);
  return match ? match[0] : null;
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

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  const [openChatKey, setOpenChatKey] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState<string>('');
  const [ratingRequestId, setRatingRequestId] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [cancelScheduleId, setCancelScheduleId] = useState<string | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [sharingLocationKey, setSharingLocationKey] = useState<string | null>(null);
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

  const handleShareLocation = (
    req: ServiceRequest,
    quote: ServiceQuote,
    channel: 'whatsapp' | 'chat'
  ) => {
    const key = `${req.id}-${quote.id}-${channel}`;
    setSharingLocationKey(key);

    const dispatchLink = (mapsUrl: string) => {
      setSharingLocationKey(null);
      const locationMsg = `📍 موقعي للطلب #${req.referenceCode}: ${mapsUrl}`;
      if (channel === 'chat') {
        onSendMessage(
          req.id,
          quote.technicianId,
          quote.technicianName,
          'customer',
          locationMsg
        );
      } else {
        window.open(
          buildWhatsAppLink(quote.technicianPhone, locationMsg),
          '_blank',
          'noopener,noreferrer'
        );
      }
    };

    const fallbackUrl = `https://maps.google.com/?q=${encodeURIComponent(
      `${req.district} ${req.addressText}`
    )}`;

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          dispatchLink(`https://maps.google.com/?q=${latitude},${longitude}`);
        },
        () => dispatchLink(fallbackUrl),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      dispatchLink(fallbackUrl);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-3.5 py-4 space-y-4 pb-14">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          طلباتي
        </h1>
        <button
          type="button"
          onClick={onNewRequest}
          className="px-3.5 h-9 bg-[#FF5A00] text-white text-xs font-bold rounded-xl hover:bg-orange-700 transition-colors shrink-0 cursor-pointer"
        >
          + طلب جديد
        </button>
      </div>

      {/* Compact Segmented Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl overflow-x-auto no-scrollbar">
        {[
          { id: 'open' as RequestsTab, label: `عروض (${openList.length})` },
          { id: 'active' as RequestsTab, label: `جارية (${activeList.length})` },
          { id: 'history' as RequestsTab, label: `سابقة (${historyList.length})` },
          { id: 'recurring' as RequestsTab, label: `متكررة (${activeRecurringCount})` },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex-1 min-h-[36px] px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              tab === item.id
                ? 'bg-white text-[#FF5A00] shadow-sm dark:bg-slate-900 dark:text-orange-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'recurring' ? (
        visibleSchedules.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-2">
            <Repeat className="w-7 h-7 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
              لا توجد طلبات متكررة
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleSchedules.map((sched) => (
              <article
                key={sched.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {sched.serviceTitle}
                    </h2>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {getRecurrenceLabel(sched.frequency)} · القادم:{' '}
                      {sched.status === 'active'
                        ? formatArabicDateLabel(sched.nextRunDateISO)
                        : 'متوقف'}
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-bold ${
                      sched.status === 'active' ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {sched.status === 'active' ? 'نشط' : 'موقوف'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {sched.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => {
                        const res = onTriggerRecurringNow(sched.id);
                        if (res) setTab('open');
                      }}
                      className="h-8 px-3 text-xs font-bold text-white bg-[#FF5A00] rounded-lg cursor-pointer"
                    >
                      تشغيل الآن
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onToggleRecurringStatus(sched.id)}
                    className="h-8 px-3 text-xs font-semibold bg-slate-100 dark:bg-slate-800 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                  >
                    {sched.status === 'active' ? (
                      <>
                        <Pause className="w-3 h-3" /> إيقاف
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" /> استئناف
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCancelScheduleId(sched.id)}
                    className="h-8 px-2.5 text-xs font-semibold text-red-600 inline-flex items-center gap-1 mr-auto cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> حذف
                  </button>
                </div>
              </article>
            ))}
          </div>
        )
      ) : currentList.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-2.5">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
            لا توجد طلبات هنا
          </p>
          <button
            type="button"
            onClick={onNewRequest}
            className="px-4 h-9 bg-[#FF5A00] text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            اطلب خدمة الآن
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
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
            const stageIdx = getTrackingStageIndex(req.status);

            return (
              <article
                key={req.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3.5"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                      <span className="font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                        #{req.referenceCode}
                      </span>
                      <span>·</span>
                      <span>{req.createdAt}</span>
                      {req.urgency === 'urgent' && (
                        <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold text-[10px]">
                          طارئ
                        </span>
                      )}
                    </div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {req.serviceTitle}
                    </h2>
                  </div>

                  <span
                    className={`text-[11px] font-bold shrink-0 ${
                      req.status === 'open_for_quotes' || req.status === 'en_route'
                        ? 'text-[#FF5A00]'
                        : req.status === 'completed'
                        ? 'text-emerald-600'
                        : req.status === 'cancelled'
                        ? 'text-red-600'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {req.status === 'open_for_quotes' && `${reqQuotes.length} عروض`}
                    {req.status === 'quote_accepted' && 'تم التأكيد'}
                    {req.status === 'en_route' && 'في الطريق'}
                    {req.status === 'in_progress' && 'جاري التنفيذ'}
                    {req.status === 'completed' && 'مكتمل'}
                    {req.status === 'cancelled' && 'ملغي'}
                  </span>
                </div>

                {/* Compact Stepper */}
                {req.status !== 'cancelled' && (
                  <div className="grid grid-cols-5 gap-1">
                    {TRACKING_STAGES.map((st, idx) => {
                      const isDone = idx < stageIdx || req.status === 'completed';
                      const isCurrent = idx === stageIdx && req.status !== 'completed';
                      return (
                        <div key={st.id} className="space-y-1">
                          <div
                            className={`h-1.5 rounded-full ${
                              isCurrent
                                ? 'bg-[#FF5A00]'
                                : isDone
                                ? 'bg-emerald-600'
                                : 'bg-slate-200 dark:bg-slate-800'
                            }`}
                          />
                          <div
                            className={`text-[10px] text-center truncate ${
                              isCurrent
                                ? 'font-bold text-[#FF5A00]'
                                : isDone
                                ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {st.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {req.status === 'en_route' && acceptedQuote && (
                  <LiveTechnicianRouteMap
                    request={req}
                    quote={acceptedQuote}
                    technicians={technicians}
                    isDark={isDark}
                  />
                )}

                {/* Brief Info */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {req.district}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {req.preferredDate} · {req.preferredTime}
                  </span>
                </div>

                {req.faultPhotos && req.faultPhotos.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {req.faultPhotos.map((src, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPreviewPhotoUrl(src)}
                        className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer"
                      >
                        <img src={src} alt="عطل" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Incoming Quotes (Open Request) */}
                {req.status === 'open_for_quotes' && (
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                    {reqQuotes.length === 0 ? (
                      <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl p-3 text-center text-xs text-slate-600 dark:text-slate-300">
                        تم إرسال إشعار لـ{' '}
                        <strong>{req.routingInfo?.notifiedCount || 3}</strong> فنيين ·
                        بانتظار الردود
                      </div>
                    ) : (
                      reqQuotes.map((quote) => {
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

                        return (
                          <div
                            key={quote.id}
                            className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {quote.isCompany && (
                                    <Building2 className="w-3.5 h-3.5 text-[#FF5A00]" />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => onViewTechnicianStats(quote.technicianId)}
                                    className="text-xs font-bold text-slate-900 dark:text-slate-100 hover:text-[#FF5A00] cursor-pointer"
                                  >
                                    {quote.technicianName}
                                  </button>
                                  <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-600 tabular-nums">
                                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                    {displayAvg}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {quote.estimatedArrival}
                                  </span>
                                  {quote.warrantyLabel && (
                                    <span className="text-orange-700 dark:text-orange-400">
                                      · {quote.warrantyLabel}
                                    </span>
                                  )}
                                </div>
                                {quote.notes && (
                                  <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                                    {quote.notes}
                                  </p>
                                )}
                              </div>

                              <div className="text-left shrink-0">
                                <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                                  {formatEGP(promoBreakdown.finalPriceEGP)}
                                </div>
                                {quoteComparison.savingsPercent >= 2 && (
                                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                    وفر {quoteComparison.savingsPercent}%
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions: Direct Call & WhatsApp for Urgent/Responding Techs + Approve */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmingOrder({ request: req, quote });
                                  setConfirmPaymentMethod(req.paymentMethod || 'cash');
                                  setConfirmWalletProvider(
                                    req.walletProvider || WALLET_PROVIDERS[0]
                                  );
                                }}
                                className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>موافق</span>
                              </button>

                              {req.urgency === 'urgent' && (
                                <>
                                  <a
                                    href={`tel:${quote.technicianPhone}`}
                                    className="h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-lg inline-flex items-center gap-1"
                                  >
                                    <Phone className="w-3.5 h-3.5 text-[#FF5A00]" />
                                    <span>اتصال</span>
                                  </a>
                                  <a
                                    href={buildWhatsAppLink(
                                      quote.technicianPhone,
                                      `أهلاً ${quote.technicianName}، بخصوص الطلب الطارئ #${req.referenceCode} (${req.serviceTitle}).`
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-9 px-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-lg inline-flex items-center gap-1"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>واتساب</span>
                                  </a>
                                </>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenChatKey(isChatOpen ? null : chatKey);
                                  setChatInput('');
                                }}
                                className="h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg inline-flex items-center gap-1 cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>
                                  محادثة{threadMessages.length > 0 ? ` (${threadMessages.length})` : ''}
                                </span>
                              </button>
                            </div>

                            {/* Chat Drawer with 1-Tap Location Share */}
                            {isChatOpen && (
                              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 space-y-2">
                                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                  {threadMessages.length === 0 ? (
                                    <p className="text-[11px] text-slate-400 text-center py-1">
                                      ابدأ المحادثة أو أرسل موقعك
                                    </p>
                                  ) : (
                                    threadMessages.map((msg) => {
                                      const mapUrl = extractMapsUrl(msg.text);
                                      return (
                                        <div
                                          key={msg.id}
                                          className={`flex flex-col ${
                                            msg.senderRole === 'customer'
                                              ? 'items-start'
                                              : 'items-end'
                                          }`}
                                        >
                                          <div
                                            className={`max-w-[85%] rounded-xl px-2.5 py-1.5 text-xs ${
                                              msg.senderRole === 'customer'
                                                ? 'bg-[#FF5A00] text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                                            }`}
                                          >
                                            {mapUrl ? (
                                              <a
                                                href={mapUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 font-bold underline"
                                              >
                                                <MapPin className="w-3.5 h-3.5" />
                                                <span>فتح الموقع على الخريطة</span>
                                              </a>
                                            ) : (
                                              msg.text
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>

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
                                  className="flex items-center gap-1.5"
                                >
                                  <button
                                    type="button"
                                    title="إرسال موقعي"
                                    onClick={() => handleShareLocation(req, quote, 'chat')}
                                    className="h-9 px-2.5 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-[#FF5A00] border border-orange-200 dark:border-orange-800 inline-flex items-center justify-center shrink-0 cursor-pointer"
                                  >
                                    <LocateFixed className="w-4 h-4" />
                                  </button>
                                  <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="رسالة..."
                                    className="flex-1 h-9 px-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-[#FF5A00]"
                                  />
                                  <button
                                    type="submit"
                                    className="h-9 px-3 bg-[#FF5A00] text-white text-xs font-bold rounded-lg cursor-pointer"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                  </button>
                                </form>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setCancelConfirmId(req.id)}
                        className="text-[11px] font-semibold text-red-600 px-2 py-1 cursor-pointer"
                      >
                        إلغاء الطلب
                      </button>
                    </div>
                  </div>
                )}

                {/* Accepted / Active / Completed Details */}
                {req.status !== 'open_for_quotes' &&
                  req.status !== 'cancelled' &&
                  acceptedQuote && (() => {
                    const acceptedPromo = computeDiscountedPrice(
                      acceptedQuote.priceEGP,
                      req.discountPercent,
                      req.maxDiscountEGP,
                      req.loyaltyDiscountEGP || 0
                    );
                    const isSharingLoc =
                      sharingLocationKey === `${req.id}-${acceptedQuote.id}-whatsapp`;

                    return (
                      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        <div className="bg-orange-50/60 dark:bg-orange-950/35 border border-orange-200/80 dark:border-orange-800/70 rounded-xl p-3 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[11px] text-orange-700 dark:text-orange-400 font-bold inline-flex items-center gap-1">
                              {req.status === 'en_route' ? (
                                <Navigation className="w-3.5 h-3.5" />
                              ) : (
                                <ShieldCheck className="w-3.5 h-3.5" />
                              )}
                              <span>{acceptedQuote.technicianName}</span>
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-400">
                              {acceptedQuote.estimatedArrival} ·{' '}
                              {getPaymentMethodLabel(req.paymentMethod, req.walletProvider)}
                            </div>
                          </div>
                          <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 tabular-nums shrink-0">
                            {formatEGP(acceptedPromo.finalPriceEGP)}
                          </div>
                        </div>

                        {/* Quick Contact + Easy Location Share */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <a
                            href={`tel:${acceptedQuote.technicianPhone}`}
                            className="h-9 px-3 text-xs font-bold bg-slate-100 dark:bg-slate-800 rounded-lg inline-flex items-center gap-1.5"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#FF5A00]" />
                            <span>اتصال</span>
                          </a>

                          <a
                            href={buildWhatsAppLink(
                              acceptedQuote.technicianPhone,
                              `أهلاً ${acceptedQuote.technicianName}، بخصوص طلب #${req.referenceCode} (${req.serviceTitle}).`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-9 px-3 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg inline-flex items-center gap-1.5"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>واتساب</span>
                          </a>

                          <button
                            type="button"
                            disabled={isSharingLoc}
                            onClick={() =>
                              handleShareLocation(req, acceptedQuote, 'whatsapp')
                            }
                            className="h-9 px-3 text-xs font-bold text-orange-800 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/60 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <LocateFixed className="w-3.5 h-3.5" />
                            <span>{isSharingLoc ? 'جاري التحديد...' : 'إرسال موقعي'}</span>
                          </button>

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
                              className="h-9 px-3.5 text-xs font-bold text-white bg-[#FF5A00] rounded-lg inline-flex items-center gap-1 mr-auto cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{req.status === 'completed' ? 'تقييم' : 'تأكيد وتقييم'}</span>
                            </button>
                          )}
                        </div>

                        {req.rating && (
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                            <span className="inline-flex items-center gap-0.5 text-amber-500">
                              {Array.from({ length: req.rating }).map((_, idx) => (
                                <Star key={idx} className="w-3.5 h-3.5 fill-amber-500" />
                              ))}
                            </span>
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
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF5A00] cursor-pointer"
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>الملخص</span>
                            </button>
                          </div>
                        )}

                        {req.status === 'completed' && !req.isWarrantyClaim && (
                          <DigitalWarrantyCard
                            request={req}
                            quote={acceptedQuote}
                            existingClaimRequest={requests.find(
                              (r) => r.warrantyClaimForRef === req.referenceCode
                            )}
                            onRequestWarrantyCheck={onRequestWarrantyCheck}
                            onJumpToClaims={() => setTab('open')}
                          />
                        )}
                      </div>
                    );
                  })()}
              </article>
            );
          })}
        </div>
      )}

      {/* Cancel Request Modal */}
      {cancelConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold">إلغاء الطلب؟</h3>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelConfirmId(null)}
                className="h-9 px-3.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={() => {
                  onCancelRequest(cancelConfirmId);
                  setCancelConfirmId(null);
                }}
                className="h-9 px-4 text-xs font-bold text-white bg-red-600 rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rate Technician Modal */}
      {ratingRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-5 space-y-3.5">
            <h3 className="text-base font-bold">تقييم الفني</h3>
            <div className="flex items-center justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingValue(star)}
                  className="p-1 cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= ratingValue
                        ? 'fill-amber-500 text-amber-500'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              rows={2}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="رأيك باختصار..."
              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#FF5A00]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRatingRequestId(null)}
                className="h-9 px-3.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetReq = requests.find((r) => r.id === ratingRequestId);
                  const targetQuotes = quotes.filter((q) => q.requestId === ratingRequestId);
                  const targetAcceptedQuote = targetQuotes.find(
                    (q) => q.id === targetReq?.acceptedQuoteId || q.status === 'accepted'
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
                      savingsAmountEGP: targetSavings?.expectedSavingsAmountEGP || 0,
                    });
                  }
                }}
                className="h-9 px-4 text-xs font-bold text-white bg-[#FF5A00] rounded-xl cursor-pointer"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Quote & Payment Modal */}
      {confirmingOrder && (() => {
        const promoSummary = computeDiscountedPrice(
          confirmingOrder.quote.priceEGP,
          confirmingOrder.request.discountPercent,
          confirmingOrder.request.maxDiscountEGP,
          confirmingOrder.request.loyaltyDiscountEGP || 0
        );
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/65 p-0 sm:p-4">
            <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-bold">تأكيد الموافقة</h3>

              <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">الفني:</span>
                  <span className="font-bold">{confirmingOrder.quote.technicianName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الموعد:</span>
                  <span>{confirmingOrder.quote.estimatedArrival}</span>
                </div>
                {promoSummary.promoDiscountEGP > 0 && (
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                    <span className="inline-flex items-center gap-1">
                      <Tag className="w-3 h-3" /> خصم:
                    </span>
                    <span>- {formatEGP(promoSummary.promoDiscountEGP)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1.5 border-t border-slate-200 dark:border-slate-700 font-extrabold text-sm">
                  <span>الإجمالي:</span>
                  <span className="text-[#FF5A00]">
                    {formatEGP(promoSummary.finalPriceEGP)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmPaymentMethod('cash')}
                  className={`h-11 px-3 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                    confirmPaymentMethod === 'cash'
                      ? 'border-[#FF5A00] bg-orange-50 text-[#FF5A00] dark:bg-orange-950/50'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>نقداً</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmPaymentMethod('wallet')}
                  className={`h-11 px-3 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                    confirmPaymentMethod === 'wallet'
                      ? 'border-[#FF5A00] bg-orange-50 text-[#FF5A00] dark:bg-orange-950/50'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span>محفظة</span>
                </button>
              </div>

              {confirmPaymentMethod === 'wallet' && (
                <div className="flex flex-wrap gap-1.5">
                  {WALLET_PROVIDERS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setConfirmWalletProvider(p)}
                      className={`h-8 px-2.5 text-xs font-bold rounded-lg border cursor-pointer ${
                        confirmWalletProvider === p
                          ? 'bg-[#FF5A00] text-white border-[#FF5A00]'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmingOrder(null)}
                  className="h-10 px-4 text-xs font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer"
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
                  className="h-10 px-5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl inline-flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>تأكيد</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Cancel Recurring Modal */}
      {cancelScheduleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold">إلغاء التكرار؟</h3>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelScheduleId(null)}
                className="h-9 px-3.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={() => {
                  onCancelRecurringSchedule(cancelScheduleId);
                  setCancelScheduleId(null);
                }}
                className="h-9 px-4 text-xs font-bold text-white bg-red-600 rounded-xl cursor-pointer"
              >
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview */}
      {previewPhotoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-2 left-2 w-9 h-9 rounded-xl bg-slate-900/80 text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={previewPhotoUrl}
              alt="معاينة"
              className="w-full max-h-[80vh] object-contain rounded-2xl"
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
