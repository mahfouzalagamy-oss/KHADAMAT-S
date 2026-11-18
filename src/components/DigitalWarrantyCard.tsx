import {
  ArrowLeft,
  Check,
  Clock,
  Scale,
  ShieldCheck,
  Star,
  TrendingDown,
  Wrench,
} from 'lucide-react';
import {
  computeDiscountedPrice,
  computeQuoteMarketComparison,
  formatEGP,
  getWarrantyCertificateStatus,
  parseWarrantyDaysFromLabel,
} from '../data/khadamatData';
import {
  ServiceQuote,
  ServiceRequest,
  TechnicianReview,
} from '../types/khadamat';

interface DigitalWarrantyCardProps {
  request: ServiceRequest;
  quote?: ServiceQuote;
  existingClaimRequest?: ServiceRequest;
  onRequestWarrantyCheck?: (request: ServiceRequest, quote?: ServiceQuote) => void;
  onJumpToClaims?: () => void;
  compact?: boolean;
}

export function DigitalWarrantyCard({
  request,
  quote,
  existingClaimRequest,
  onRequestWarrantyCheck,
  onJumpToClaims,
  compact = false,
}: DigitalWarrantyCardProps) {
  const status = getWarrantyCertificateStatus(request, quote?.warrantyLabel);

  return (
    <div
      className={`rounded-xl border transition-colors ${
        status.isActive
          ? 'bg-gradient-to-l from-emerald-50/90 via-white to-orange-50/40 dark:from-emerald-950/45 dark:via-slate-900 dark:to-orange-950/20 border-emerald-200 dark:border-emerald-800/80'
          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
      } ${compact ? 'p-3.5 space-y-2.5' : 'p-4 space-y-3'}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              status.isActive
                ? 'bg-emerald-700 dark:bg-emerald-600 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                جواز الضمان الرقمي المعتمد
              </span>
              <span
                dir="ltr"
                className="text-[11px] font-mono font-bold text-emerald-800 dark:text-emerald-300 tabular-nums"
              >
                {status.certificateCode}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              {status.isActive
                ? `يغطي نفس العطل وإعادة الفحص مجاناً حتى ${status.expiryDateLabel}`
                : `انتهت مدة الضمان (${status.totalDays} يوماً) بتاريخ ${status.expiryDateLabel}`}
            </p>
          </div>
        </div>

        <div className="text-right sm:text-left shrink-0">
          <div
            className={`text-xs font-extrabold tabular-nums ${
              status.isActive
                ? 'text-emerald-800 dark:text-emerald-300'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {status.isActive
              ? `متبقي ${status.remainingDays} من ${status.totalDays} يوم`
              : 'ضمان منتهي'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            {quote?.warrantyLabel || `ضمان ${status.totalDays} يوماً`}
          </div>
        </div>
      </div>

      {/* Warranty Remaining Progress Bar */}
      <div
        className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden"
        aria-label={`نسبة الوقت المتبقي من الضمان ${status.progressPercent}%`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            status.isActive
              ? 'bg-gradient-to-l from-emerald-600 to-emerald-500'
              : 'bg-slate-400 dark:bg-slate-600'
          }`}
          style={{ width: `${status.progressPercent}%` }}
        />
      </div>

      {!compact && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          <span className="text-[11px] text-slate-600 dark:text-slate-400">
            {existingClaimRequest
              ? `تم فتح طلب متابعة ضمان (#${existingClaimRequest.referenceCode})`
              : status.isActive
              ? 'إذا عاد نفس العطل، اطلب إعادة فحص فورية بدون رسوم معاينة.'
              : 'يمكنك طلب صيانة جديدة في أي وقت بنفس التفاصيل.'}
          </span>

          {existingClaimRequest ? (
            onJumpToClaims && (
              <button
                type="button"
                onClick={onJumpToClaims}
                className="min-h-[40px] px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 inline-flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>متابعة طلب الضمان</span>
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )
          ) : (
            status.isActive &&
            onRequestWarrantyCheck && (
              <button
                type="button"
                onClick={() => onRequestWarrantyCheck(request, quote)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Wrench className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>طلب إعادة فحص مجاني ضمن الضمان</span>
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

interface SmartQuoteComparisonStripProps {
  request: ServiceRequest;
  quotes: ServiceQuote[];
  allQuotes: ServiceQuote[];
  allRequests: ServiceRequest[];
  reviews: TechnicianReview[];
  onHighlightQuote: (quoteId: string | null) => void;
  onSelectQuoteForAccept: (quote: ServiceQuote) => void;
}

export function SmartQuoteComparisonStrip({
  request,
  quotes,
  allQuotes,
  allRequests,
  reviews,
  onHighlightQuote,
  onSelectQuoteForAccept,
}: SmartQuoteComparisonStripProps) {
  if (quotes.length < 2) return null;

  const enriched = quotes.map((q) => {
    const promo = computeDiscountedPrice(
      q.priceEGP,
      request.discountPercent,
      request.maxDiscountEGP,
      request.loyaltyDiscountEGP || 0
    );
    const comp = computeQuoteMarketComparison(
      q.priceEGP,
      request.serviceTitle,
      request.id,
      allQuotes,
      allRequests,
      reviews
    );
    const warrantyDays = parseWarrantyDaysFromLabel(q.warrantyLabel, 0);
    return {
      quote: q,
      finalPriceEGP: promo.finalPriceEGP,
      savingsPercent: comp.savingsPercent,
      warrantyDays,
    };
  });

  const lowestFinalPrice = Math.min(...enriched.map((e) => e.finalPriceEGP));
  const highestRating = Math.max(
    ...enriched.map((e) => e.quote.technicianRating)
  );
  const maxWarrantyDays = Math.max(...enriched.map((e) => e.warrantyDays));

  return (
    <div className="bg-white dark:bg-slate-900 border border-orange-200/80 dark:border-slate-700 rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-[#ea580c] dark:text-orange-400 flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
              مقارنة ذكية بين العروض ({quotes.length})
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              مقارنة فورية للسعر بعد الخصم، نسبة التوفير، التقييم، ومدة الضمان
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {enriched.map(({ quote, finalPriceEGP, savingsPercent, warrantyDays }) => {
          const isCheapest = finalPriceEGP === lowestFinalPrice;
          const isTopRated = quote.technicianRating === highestRating;
          const isLongestWarranty =
            maxWarrantyDays > 0 && warrantyDays === maxWarrantyDays;

          const topHighlight = isCheapest
            ? 'أفضل سعر'
            : isTopRated
            ? 'الأعلى تقييماً'
            : isLongestWarranty
            ? 'أطول ضمان'
            : null;

          return (
            <div
              key={`cmp-${quote.id}`}
              onMouseEnter={() => onHighlightQuote(quote.id)}
              onMouseLeave={() => onHighlightQuote(null)}
              className={`rounded-xl border p-3 flex flex-col justify-between gap-2.5 transition-colors ${
                isCheapest
                  ? 'border-emerald-300 dark:border-emerald-700/80 bg-emerald-50/45 dark:bg-emerald-950/25'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {quote.technicianName}
                  </span>
                  {topHighlight && (
                    <span
                      className={`text-[10px] font-extrabold shrink-0 ${
                        isCheapest
                          ? 'text-emerald-800 dark:text-emerald-300'
                          : 'text-[#ea580c] dark:text-orange-400'
                      }`}
                    >
                      {topHighlight}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                    {formatEGP(finalPriceEGP)}
                  </span>
                  {savingsPercent > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      <TrendingDown className="w-3 h-3 shrink-0" />
                      وفر {savingsPercent}%
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/70 dark:border-slate-700/70">
                  <div className="flex items-center justify-between tabular-nums">
                    <span>التقييم والخبرة:</span>
                    <span className="inline-flex items-center gap-1 font-bold text-slate-800 dark:text-slate-100">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      {quote.technicianRating.toFixed(1)} ({quote.technicianCompletedJobs} مهمة)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>الضمان:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {quote.warrantyLabel || 'ضمان 30 يوماً'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="shrink-0">الوصول:</span>
                    <span className="font-medium truncate inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      {quote.estimatedArrival}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectQuoteForAccept(quote)}
                className={`w-full min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  isCheapest
                    ? 'bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white'
                    : 'bg-[#FF5A00] hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 text-white'
                }`}
              >
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>اختيار العرض</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface HomeWarrantyPassportStripProps {
  completedRequests: ServiceRequest[];
  quotes: ServiceQuote[];
  onOpenWarrantyHistory: () => void;
  onRequestWarrantyCheck: (request: ServiceRequest, quote?: ServiceQuote) => void;
}

export function HomeWarrantyPassportStrip({
  completedRequests,
  quotes,
  onOpenWarrantyHistory,
  onRequestWarrantyCheck,
}: HomeWarrantyPassportStripProps) {
  const activeWarranties = completedRequests
    .map((req) => {
      const q = quotes.find(
        (item) =>
          item.id === req.acceptedQuoteId ||
          (item.requestId === req.id && item.status === 'accepted')
      );
      const status = getWarrantyCertificateStatus(req, q?.warrantyLabel);
      return { req, quote: q, status };
    })
    .filter((entry) => entry.status.isActive && !entry.req.isWarrantyClaim);

  if (activeWarranties.length === 0) return null;

  const latest = activeWarranties[0];
  const alreadyClaimed = completedRequests.some(
    (r) => r.warrantyClaimForRef === latest.req.referenceCode
  );

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6">
      <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-emerald-700 dark:bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
                جواز الضمان الرقمي الساري ({activeWarranties.length})
              </h2>
              <span
                dir="ltr"
                className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums"
              >
                {latest.status.certificateCode}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              خدمة «{latest.req.serviceTitle}» مغطاة بالضمان الرقمي — متبقي{' '}
              <strong className="text-emerald-800 dark:text-emerald-300 tabular-nums">
                {latest.status.remainingDays} يوماً
              </strong>{' '}
              (ساري حتى {latest.status.expiryDateLabel}) لإعادة الفحص مجاناً عند عودة العطل.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!alreadyClaimed && (
            <button
              type="button"
              onClick={() => onRequestWarrantyCheck(latest.req, latest.quote)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" aria-hidden="true" />
              <span>فحص ضمان مجاني</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenWarrantyHistory}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-[#ea580c] text-xs font-bold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>كل شهادات الضمان</span>
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
