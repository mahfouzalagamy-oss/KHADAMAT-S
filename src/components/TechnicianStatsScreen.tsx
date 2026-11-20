import { Building2, CheckCircle2, ShieldCheck, Star, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { computeTechnicianStats, formatEGP } from '../data/khadamatData';
import { ServiceQuote, ServiceRequest, Technician, TechnicianReview } from '../types/khadamat';

interface TechnicianStatsScreenProps {
  technician: Technician;
  reviews: TechnicianReview[];
  quotes: ServiceQuote[];
  requests: ServiceRequest[];
}

type StarFilter = 'all' | '5' | '4' | '3_or_less';

export function TechnicianStatsScreen({
  technician,
  reviews,
  quotes,
  requests,
}: TechnicianStatsScreenProps) {
  const [starFilter, setStarFilter] = useState<StarFilter>('all');

  const stats = useMemo(
    () => computeTechnicianStats(technician.id, reviews, quotes, requests),
    [technician.id, reviews, quotes, requests]
  );

  const filteredReviews = useMemo(() => {
    if (starFilter === '5') return stats.reviews.filter((r) => r.rating === 5);
    if (starFilter === '4') return stats.reviews.filter((r) => r.rating === 4);
    if (starFilter === '3_or_less') return stats.reviews.filter((r) => r.rating <= 3);
    return stats.reviews;
  }, [stats.reviews, starFilter]);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 pb-14">
      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
            إحصائيات الأداء والتقييمات
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            متوسط التقييم ومعدل قبول العروض
          </p>
        </div>

        <div className="flex items-center gap-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-[#FF5A00] dark:bg-orange-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
            {technician.isCompany ? <Building2 className="w-4 h-4" /> : technician.initials}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[200px]">
              {technician.name}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
              {technician.area}
            </div>
          </div>
        </div>
      </div>

      {/* 3-Criteria Performance Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              تقييم الأداء الدقيق (يظهر للعملاء قبل قبول العرض)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              مبني على {stats.totalReviews} تقييم موثق من عملاء الدقهلية
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 dark:text-orange-400">
            <ShieldCheck className="w-4 h-4" />
            رضا العملاء {stats.positivePercent}%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'الالتزام بالموعد', value: stats.criteriaAverages.punctuality },
            { label: 'نظافة العمل', value: stats.criteriaAverages.cleanliness },
            { label: 'الاحترافية', value: stats.criteriaAverages.professionalism },
          ].map((crit) => (
            <div
              key={crit.label}
              className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {crit.label}
                </span>
                <span className="text-xl font-extrabold text-[#FF5A00] dark:text-orange-400 tabular-nums inline-flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  {crit.value.toFixed(1)}
                </span>
              </div>
              <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#FF5A00] dark:bg-orange-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.round((crit.value / 5) * 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4-Column Performance KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">العروض المقدمة</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {stats.totalQuotesSent}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            إجمالي العروض النشطة والسابقة
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">عروض وافق عليها العملاء</div>
          <div className="text-2xl font-bold text-orange-700 dark:text-orange-400 tabular-nums">
            {stats.acceptedQuotesCount}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[#FF5A00] dark:text-orange-400" />
            <span>نسبة القبول {stats.acceptanceRatePercent}%</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">إجمالي المهام المنجزة</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {technician.completedJobs}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            خبرة {technician.yearsExp} سنوات
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            إجمالي قيمة الأعمال المقيّمة
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {formatEGP(stats.totalCompletedValueEGP)}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 inline-flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-[#FF5A00] dark:text-orange-400" />
            <span>بالجنيه المصري</span>
          </div>
        </div>
      </div>

      {/* Previous Customer Reviews List */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              تقييمات العملاء ({filteredReviews.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">آراء عملاء الدقهلية</p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
            {[
              { id: 'all' as StarFilter, label: 'الكل' },
              { id: '5' as StarFilter, label: '5 نجوم' },
              { id: '4' as StarFilter, label: '4 نجوم' },
              { id: '3_or_less' as StarFilter, label: '3 فأقل' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStarFilter(item.id)}
                className={`min-h-[36px] px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                  starFilter === item.id
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {filteredReviews.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
            لا توجد تقييمات في هذا التصنيف حالياً.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredReviews.map((item) => (
              <article key={item.id} className="p-5 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <strong className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {item.customerName}
                    </strong>
                    <span aria-hidden="true">·</span>
                    <span>{item.area}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.serviceTitle}</span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {item.priceEGP !== undefined && (
                      <span className="text-xs font-semibold text-orange-700 dark:text-orange-400 tabular-nums">
                        {formatEGP(item.priceEGP)}
                      </span>
                    )}
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                      {item.ratingBreakdown ? (
                        <>
                          <span>الموعد {item.ratingBreakdown.punctuality}</span>
                          <span>·</span>
                          <span>النظافة {item.ratingBreakdown.cleanliness}</span>
                          <span>·</span>
                          <span>الاحترافية {item.ratingBreakdown.professionalism}</span>
                        </>
                      ) : (
                        <>
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{item.rating.toFixed(1)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  «{item.review}»
                </p>

                <div className="text-[11px] text-slate-400 dark:text-slate-500">
                  {item.dateLabel}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
