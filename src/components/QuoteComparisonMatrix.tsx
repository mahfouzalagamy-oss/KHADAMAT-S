import {
  Building2,
  Check,
  Clock,
  Scale,
  ShieldCheck,
  Star,
  TrendingDown,
  X,
} from 'lucide-react';
import {
  computeDiscountedPrice,
  computeQuoteMarketComparison,
  computeTechnicianStats,
  formatEGP,
  parseWarrantyDaysFromLabel,
} from '../data/khadamatData';
import {
  ServiceQuote,
  ServiceRequest,
  TechnicianReview,
} from '../types/khadamat';

interface QuoteComparisonMatrixProps {
  request: ServiceRequest;
  quotes: ServiceQuote[];
  selectedQuoteIds: string[];
  allQuotes: ServiceQuote[];
  allRequests: ServiceRequest[];
  reviews: TechnicianReview[];
  onToggleQuoteSelection: (quoteId: string) => void;
  onAutoSelectQuotes: (quoteIds: string[]) => void;
  onHighlightQuote: (quoteId: string | null) => void;
  onSelectQuoteForAccept: (quote: ServiceQuote) => void;
}

export function QuoteComparisonMatrix({
  request,
  quotes,
  selectedQuoteIds,
  allQuotes,
  allRequests,
  reviews,
  onToggleQuoteSelection,
  onAutoSelectQuotes,
  onHighlightQuote,
  onSelectQuoteForAccept,
}: QuoteComparisonMatrixProps) {
  if (quotes.length < 2) return null;

  const selectedQuotes = selectedQuoteIds
    .map((id) => quotes.find((q) => q.id === id))
    .filter((q): q is ServiceQuote => Boolean(q))
    .slice(0, 3);

  const enriched = selectedQuotes.map((q) => {
    const promo = computeDiscountedPrice(
      q.priceEGP,
      request.discountPercent,
      request.maxDiscountEGP,
      request.loyaltyDiscountEGP || 0
    );
    const market = computeQuoteMarketComparison(
      q.priceEGP,
      request.serviceTitle,
      request.id,
      allQuotes,
      allRequests,
      reviews
    );
    const warrantyDays = parseWarrantyDaysFromLabel(q.warrantyLabel, 0);
    const techStats = computeTechnicianStats(
      q.technicianId,
      reviews,
      allQuotes,
      allRequests
    );

    return {
      quote: q,
      finalPriceEGP: promo.finalPriceEGP,
      originalPriceEGP: q.priceEGP,
      hasPromo: promo.promoDiscountEGP > 0,
      savingsPercent: market.savingsPercent,
      warrantyDays,
      techStats,
    };
  });

  const minFinalPrice =
    enriched.length >= 2
      ? Math.min(...enriched.map((e) => e.finalPriceEGP))
      : null;
  const maxWarrantyDays =
    enriched.length >= 2
      ? Math.max(...enriched.map((e) => e.warrantyDays))
      : 0;
  const maxRating =
    enriched.length >= 2
      ? Math.max(...enriched.map((e) => e.quote.technicianRating))
      : null;

  const maxReached = selectedQuotes.length >= 3;

  return (
    <section
      aria-label="جدول مقارنة عروض الأسعار"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden"
    >
      {/* Interactive 2-3 Offer Selection Bar */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/70 dark:bg-slate-800/40">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/70 text-[#FF5A00] dark:text-orange-400 flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                مقارنة العروض جنباً إلى جنب
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                اختر 2 إلى 3 عروض من القائمة ({selectedQuotes.length}/3 محدد)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {quotes.length > 2 && selectedQuotes.length < Math.min(3, quotes.length) && (
              <button
                type="button"
                onClick={() =>
                  onAutoSelectQuotes(quotes.slice(0, 3).map((q) => q.id))
                }
                className="min-h-[36px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-[#FF5A00] text-[11px] font-semibold text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap cursor-pointer"
              >
                اختيار أول {Math.min(3, quotes.length)} عروض
              </button>
            )}
            {selectedQuotes.length > 0 && (
              <button
                type="button"
                onClick={() => onAutoSelectQuotes([])}
                className="min-h-[36px] px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
              >
                مسح التحديد
              </button>
            )}
          </div>
        </div>

        {/* Selectable Offer Toggles (2-3 max) */}
        <div className="flex flex-wrap items-center gap-2">
          {quotes.map((q) => {
            const isSelected = selectedQuoteIds.includes(q.id);
            const isDisabled = !isSelected && maxReached;
            const discounted = computeDiscountedPrice(
              q.priceEGP,
              request.discountPercent,
              request.maxDiscountEGP,
              request.loyaltyDiscountEGP || 0
            );

            return (
              <button
                key={`pick-${q.id}`}
                type="button"
                disabled={isDisabled}
                aria-pressed={isSelected}
                onClick={() => onToggleQuoteSelection(q.id)}
                onMouseEnter={() => onHighlightQuote(q.id)}
                onMouseLeave={() => onHighlightQuote(null)}
                className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-[#FF5A00] border-[#FF5A00] text-white dark:bg-orange-600 dark:border-orange-600 cursor-pointer'
                    : isDisabled
                      ? 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#FF5A00] cursor-pointer'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'border border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" aria-hidden="true" />}
                </span>
                <span className="max-w-[140px] truncate">{q.technicianName}</span>
                <span
                  className={`tabular-nums text-[11px] ${
                    isSelected
                      ? 'text-orange-100'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  ({formatEGP(discounted.finalPriceEGP)})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Table or Selection Prompt */}
      {selectedQuotes.length < 2 ? (
        <div className="p-5 text-center space-y-2.5">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            اختر عرضين أو ثلاثة عروض أعلاه لعرضها جنباً إلى جنب في جدول المقارنة.
          </p>
          <button
            type="button"
            onClick={() =>
              onAutoSelectQuotes(quotes.slice(0, Math.min(3, quotes.length)).map((q) => q.id))
            }
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#FF5A00] hover:bg-orange-700 dark:bg-orange-600 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            مقارنة أفضل {Math.min(3, quotes.length)} عروض تلقائياً
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60">
                <th
                  scope="col"
                  className="sticky right-0 z-10 bg-white dark:bg-slate-900 min-w-[110px] w-[130px] px-3.5 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 border-l border-slate-100 dark:border-slate-800 align-top"
                >
                  وجه المقارنة
                </th>
                {enriched.map(({ quote, finalPriceEGP }) => {
                  const isCheapest = minFinalPrice !== null && finalPriceEGP === minFinalPrice;
                  return (
                    <th
                      key={`col-head-${quote.id}`}
                      scope="col"
                      onMouseEnter={() => onHighlightQuote(quote.id)}
                      onMouseLeave={() => onHighlightQuote(null)}
                      className={`min-w-[165px] sm:min-w-[190px] px-3.5 py-3 align-top border-l last:border-l-0 border-slate-100 dark:border-slate-800 ${
                        isCheapest ? 'bg-emerald-50/35 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                            {quote.isCompany && (
                              <Building2
                                className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400 shrink-0"
                                aria-hidden="true"
                              />
                            )}
                            <span className="truncate">{quote.technicianName}</span>
                          </div>
                          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                            {quote.technicianCompletedJobs} طلب مكتمل
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onToggleQuoteSelection(quote.id)}
                          aria-label={`إزالة ${quote.technicianName} من المقارنة`}
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center shrink-0 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {/* Row 1: Price */}
              <tr>
                <th
                  scope="row"
                  className="sticky right-0 z-10 bg-white dark:bg-slate-900 px-3.5 py-3 font-semibold text-slate-700 dark:text-slate-300 border-l border-slate-100 dark:border-slate-800"
                >
                  السعر
                </th>
                {enriched.map(
                  ({ quote, finalPriceEGP, originalPriceEGP, hasPromo, savingsPercent }) => {
                    const isCheapest =
                      minFinalPrice !== null && finalPriceEGP === minFinalPrice;
                    return (
                      <td
                        key={`price-${quote.id}`}
                        className={`px-3.5 py-3 border-l last:border-l-0 border-slate-100 dark:border-slate-800 align-top ${
                          isCheapest ? 'bg-emerald-50/35 dark:bg-emerald-950/20' : ''
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                              {formatEGP(finalPriceEGP)}
                            </span>
                            {hasPromo && (
                              <span className="text-[11px] line-through text-slate-400 tabular-nums">
                                {formatEGP(originalPriceEGP)}
                              </span>
                            )}
                          </div>
                          {isCheapest ? (
                            <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 tabular-nums">
                              <TrendingDown className="w-3 h-3 shrink-0" aria-hidden="true" />
                              <span>
                                الأقل سعراً{savingsPercent > 0 ? ` · توفير ${savingsPercent}%` : ''}
                              </span>
                            </div>
                          ) : (
                            savingsPercent > 0 && (
                              <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 tabular-nums">
                                أقل {savingsPercent}% من المتوسط
                              </div>
                            )
                          )}
                        </div>
                      </td>
                    );
                  }
                )}
              </tr>

              {/* Row 2: Warranty Duration */}
              <tr>
                <th
                  scope="row"
                  className="sticky right-0 z-10 bg-white dark:bg-slate-900 px-3.5 py-3 font-semibold text-slate-700 dark:text-slate-300 border-l border-slate-100 dark:border-slate-800"
                >
                  مدة الضمان
                </th>
                {enriched.map(({ quote, warrantyDays, finalPriceEGP }) => {
                  const isCheapest = minFinalPrice !== null && finalPriceEGP === minFinalPrice;
                  const isLongestWarranty =
                    maxWarrantyDays > 0 && warrantyDays === maxWarrantyDays;
                  return (
                    <td
                      key={`warranty-${quote.id}`}
                      className={`px-3.5 py-3 border-l last:border-l-0 border-slate-100 dark:border-slate-800 align-top ${
                        isCheapest ? 'bg-emerald-50/35 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 inline-flex items-center gap-1.5">
                          <ShieldCheck
                            className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400 shrink-0"
                            aria-hidden="true"
                          />
                          <span>{quote.warrantyLabel || 'بدون ضمان محدد'}</span>
                        </div>
                        {isLongestWarranty && (
                          <div className="text-[11px] font-bold text-orange-700 dark:text-orange-400">
                            أطول مدة ضمان
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Row 3: Rating & Detailed Breakdown */}
              <tr>
                <th
                  scope="row"
                  className="sticky right-0 z-10 bg-white dark:bg-slate-900 px-3.5 py-3 font-semibold text-slate-700 dark:text-slate-300 border-l border-slate-100 dark:border-slate-800"
                >
                  التقييم
                </th>
                {enriched.map(({ quote, techStats, finalPriceEGP }) => {
                  const isCheapest = minFinalPrice !== null && finalPriceEGP === minFinalPrice;
                  const isTopRated =
                    maxRating !== null && quote.technicianRating === maxRating;
                  const { criteriaAverages } = techStats;
                  return (
                    <td
                      key={`rating-${quote.id}`}
                      className={`px-3.5 py-3 border-l last:border-l-0 border-slate-100 dark:border-slate-800 align-top ${
                        isCheapest ? 'bg-emerald-50/35 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 tabular-nums">
                          <Star
                            className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="font-extrabold text-slate-900 dark:text-slate-100">
                            {quote.technicianRating.toFixed(1)}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            ({techStats.totalReviews})
                          </span>
                          {isTopRated && (
                            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                              · الأعلى
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 tabular-nums leading-snug">
                          الموعد {criteriaAverages.punctuality.toFixed(1)} · النظافة{' '}
                          {criteriaAverages.cleanliness.toFixed(1)} · الاحترافية{' '}
                          {criteriaAverages.professionalism.toFixed(1)}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Row 4: Expected Arrival Date/Time */}
              <tr>
                <th
                  scope="row"
                  className="sticky right-0 z-10 bg-white dark:bg-slate-900 px-3.5 py-3 font-semibold text-slate-700 dark:text-slate-300 border-l border-slate-100 dark:border-slate-800"
                >
                  الوصول المتوقع
                </th>
                {enriched.map(({ quote, finalPriceEGP }) => {
                  const isCheapest = minFinalPrice !== null && finalPriceEGP === minFinalPrice;
                  return (
                    <td
                      key={`eta-${quote.id}`}
                      className={`px-3.5 py-3 border-l last:border-l-0 border-slate-100 dark:border-slate-800 align-top ${
                        isCheapest ? 'bg-emerald-50/35 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      <div className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                        <Clock
                          className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0"
                          aria-hidden="true"
                        />
                        <span>{quote.estimatedArrival}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Row 5: Direct Approval CTA */}
              <tr>
                <th
                  scope="row"
                  className="sticky right-0 z-10 bg-white dark:bg-slate-900 px-3.5 py-3 font-semibold text-slate-700 dark:text-slate-300 border-l border-slate-100 dark:border-slate-800"
                >
                  القرار
                </th>
                {enriched.map(({ quote, finalPriceEGP }) => {
                  const isCheapest = minFinalPrice !== null && finalPriceEGP === minFinalPrice;
                  return (
                    <td
                      key={`action-${quote.id}`}
                      className={`px-3.5 py-3 border-l last:border-l-0 border-slate-100 dark:border-slate-800 ${
                        isCheapest ? 'bg-emerald-50/35 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectQuoteForAccept(quote)}
                        className={`w-full min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                          isCheapest
                            ? 'bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white'
                            : 'bg-[#FF5A00] hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 text-white'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>موافق على العرض</span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
