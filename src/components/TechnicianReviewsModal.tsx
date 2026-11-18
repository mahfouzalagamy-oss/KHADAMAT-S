import { Building2, ShieldCheck, Star, X } from 'lucide-react';
import { computeTechnicianStats, formatEGP } from '../data/khadamatData';
import {
  ServiceQuote,
  ServiceRequest,
  Technician,
  TechnicianReview,
} from '../types/khadamat';

interface TechnicianReviewsModalProps {
  technician: Technician | null;
  reviews: TechnicianReview[];
  quotes: ServiceQuote[];
  requests: ServiceRequest[];
  onClose: () => void;
}

export function TechnicianReviewsModal({
  technician,
  reviews,
  quotes,
  requests,
  onClose,
}: TechnicianReviewsModalProps) {
  if (!technician) return null;

  const stats = computeTechnicianStats(technician.id, reviews, quotes, requests);
  const starLevels: (5 | 4 | 3 | 2 | 1)[] = [5, 4, 3, 2, 1];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/65 backdrop-blur-sm p-0 md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tech-reviews-title"
    >
      <div className="w-full md:max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[88vh] flex flex-col overflow-hidden">
        <div className="md:hidden w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 md:px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#FF5A00] dark:bg-orange-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
              {technician.isCompany ? <Building2 className="w-5 h-5" /> : technician.initials}
            </div>
            <div className="min-w-0">
              <h2 id="tech-reviews-title" className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                {technician.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{technician.specialty}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 md:p-6 space-y-6">
          {/* Average & Distribution */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
            <div className="sm:col-span-5 space-y-2">
              <span className="text-xs font-semibold text-orange-700 dark:text-orange-400 inline-flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                متوسط التقييم الحقيقي
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {stats.averageRating.toFixed(1)}
                </span>
                <span className="text-sm text-slate-400 dark:text-slate-500 font-semibold tabular-nums">/ 5.0</span>
              </div>
              <div className="flex items-center gap-0.5 text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(stats.averageRating)
                        ? 'fill-amber-500 text-amber-500'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {stats.totalReviews} تقييم · {technician.completedJobs} مهمة مكتملة
              </p>
            </div>

            <div className="sm:col-span-7 space-y-2">
              {starLevels.map((star) => {
                const count = stats.ratingCounts[star];
                const pct =
                  stats.totalReviews > 0
                    ? Math.round((count / stats.totalReviews) * 100)
                    : 0;
                return (
                  <div key={star} className="flex items-center gap-2.5 text-xs">
                    <span className="w-10 text-slate-700 dark:text-slate-300 font-semibold inline-flex items-center gap-1 tabular-nums">
                      {star}
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    </span>
                    <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#FF5A00] dark:bg-orange-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-12 text-left text-slate-500 dark:text-slate-400 tabular-nums">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Reviews */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              آراء وتقييمات العملاء السابقة ({stats.reviews.length})
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              {stats.reviews.map((rev) => (
                <div key={rev.id} className="p-4 space-y-1.5 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      <strong className="text-slate-900 dark:text-slate-100 font-semibold">{rev.customerName}</strong>
                      <span className="mx-1.5">·</span>
                      <span>{rev.area}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {rev.priceEGP !== undefined && (
                        <span className="text-xs font-semibold text-orange-700 dark:text-orange-400 tabular-nums">
                          {formatEGP(rev.priceEGP)}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: rev.rating }).map((_, idx) => (
                          <Star key={idx} className="w-3.5 h-3.5 fill-amber-500" />
                        ))}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">«{rev.review}»</p>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500">
                    {rev.serviceTitle} · {rev.dateLabel}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
