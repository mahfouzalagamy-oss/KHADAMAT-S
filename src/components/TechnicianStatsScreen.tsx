import { Building2, CheckCircle2, ShieldCheck, Star, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { computeTechnicianStats, formatEGP } from '../data/khadamatData';
import {
  ServiceQuote,
  ServiceRequest,
  Technician,
  TechnicianReview,
} from '../types/khadamat';

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

  const starLevels: (5 | 4 | 3 | 2 | 1)[] = [5, 4, 3, 2, 1];

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

      {/* Main Rating Summary & Star Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Average Rating Hero Card */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between gap-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">متوسط التقييم العام</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 dark:text-orange-400">
                <ShieldCheck className="w-4 h-4" />
                موثق من طلبات مكتملة
              </span>
            </div>

            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-5xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {stats.averageRating.toFixed(1)}
              </span>
              <span className="text-base text-slate-400 dark:text-slate-500 font-semibold tabular-nums">
                / 5.0
              </span>
            </div>

            <div className="flex items-center gap-1" aria-label={`التقييم ${stats.averageRating} من 5`}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(stats.averageRating)
                      ? 'fill-amber-500 text-amber-500'
                      : 'text-slate-200 dark:text-slate-700'
                  }`}
                />
              ))}
              <span className="text-xs text-slate-500 dark:text-slate-400 mr-2 tabular-nums">
                بناءً على {stats.totalReviews} تقييم من العملاء
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400">نسبة رضا العملاء (4 و 5 نجوم)</span>
            <span className="font-bold text-orange-700 dark:text-orange-400 tabular-nums">
              {stats.positivePercent}%
            </span>
          </div>
        </div>

        {/* 5-Level Star Distribution Bars */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">توزيع التقييمات السابقة</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">يظهر للعملاء عند استعراض عروضك</span>
          </div>

          <div className="space-y-3">
            {starLevels.map((star) => {
              const count = stats.ratingCounts[star];
              const pct =
                stats.totalReviews > 0
                  ? Math.round((count / stats.totalReviews) * 100)
                  : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <div className="w-16 flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 shrink-0 tabular-nums">
                    <span>{star}</span>
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  </div>

                  <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FF5A00] dark:bg-orange-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="w-20 text-left text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                    {count} ({pct}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4-Column Performance KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">العروض المقدمة</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {stats.totalQuotesSent}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">إجمالي العروض النشطة والسابقة</div>
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
          <div className="text-[11px] text-slate-400 dark:text-slate-500">خبرة {technician.yearsExp} سنوات</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">إجمالي قيمة الأعمال المقيّمة</div>
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
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              آراء عملاء الدقهلية
            </p>
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
                    <div className="inline-flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: item.rating }).map((_, idx) => (
                        <Star key={idx} className="w-3.5 h-3.5 fill-amber-500" />
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">«{item.review}»</p>

                <div className="text-[11px] text-slate-400 dark:text-slate-500">{item.dateLabel}</div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
