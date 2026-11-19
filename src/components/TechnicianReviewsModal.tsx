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
          {/* 3-Criteria Performance Summary */}
          <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-semibold text-orange-700 dark:text-orange-400 inline-flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                تقييم الأداء الدقيق من العملاء
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {stats.totalReviews} تقييم · {technician.completedJobs} مهمة مكتملة
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  label: 'الالتزام بالموعد',
                  value: stats.criteriaAverages.punctuality,
                },
                {
                  label: 'نظافة العمل',
                  value: stats.criteriaAverages.cleanliness,
                },
                {
                  label: 'الاحترافية',
                  value: stats.criteriaAverages.professionalism,
                },
              ].map((crit) => (
                <div
                  key={crit.label}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {crit.label}
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 tabular-nums inline-flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      {crit.value.toFixed(1)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FF5A00] dark:bg-orange-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((crit.value / 5) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
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
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                        {rev.ratingBreakdown ? (
                          <>
                            <span>الموعد {rev.ratingBreakdown.punctuality}</span>
                            <span>·</span>
                            <span>النظافة {rev.ratingBreakdown.cleanliness}</span>
                            <span>·</span>
                            <span>الاحترافية {rev.ratingBreakdown.professionalism}</span>
                          </>
                        ) : (
                          <>
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span>{rev.rating.toFixed(1)}</span>
                          </>
                        )}
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
