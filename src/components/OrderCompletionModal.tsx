import {
  Award,
  Banknote,
  Calendar,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Star,
  Tag,
  TrendingDown,
  UserCheck,
  Wallet,
  X,
} from 'lucide-react';
import {
  KHADAMAT_BONUS_POINTS_FOR_RATING,
  KHADAMAT_POINTS_PER_COMPLETED_ORDER,
  computeDiscountedPrice,
  formatEGP,
  getPaymentMethodLabel,
} from '../data/khadamatData';
import { RatingBreakdown, ServiceQuote, ServiceRequest } from '../types/khadamat';
import { DigitalWarrantyCard } from './DigitalWarrantyCard';

interface CelebrationEmblemProps {
  variant?: 'achievement' | 'booking';
}

export function CelebrationEmblem({ variant = 'achievement' }: CelebrationEmblemProps) {
  return (
    <div
      className="relative w-28 h-28 mx-auto flex items-center justify-center select-none"
      aria-hidden="true"
    >
      {/* Expanding Soft Celebration Ring */}
      <div className="absolute inset-4 rounded-full border-2 border-emerald-400/70 dark:border-emerald-400/60 animate-celebration-halo" />
      <div
        className="absolute inset-2 rounded-full border border-amber-400/50 dark:border-amber-300/40 animate-celebration-halo"
        style={{ animationDelay: '220ms' }}
      />

      {/* Radiating Joyful Stars */}
      <Star
        className="w-5 h-5 fill-amber-400 text-amber-500 dark:fill-amber-400 dark:text-amber-300 absolute -top-0.5 right-4 animate-celebration-star"
        style={{ animationDelay: '90ms, 700ms' }}
      />
      <Star
        className="w-4 h-4 fill-emerald-400 text-emerald-500 dark:fill-emerald-400 dark:text-emerald-300 absolute top-3 left-1 animate-celebration-star"
        style={{ animationDelay: '180ms, 950ms' }}
      />
      <Star
        className="w-4 h-4 fill-amber-300 text-amber-500 dark:fill-amber-300 dark:text-amber-200 absolute bottom-2 right-1 animate-celebration-star"
        style={{ animationDelay: '240ms, 820ms' }}
      />
      <Star
        className="w-5 h-5 fill-orange-400 text-[#FF5A00] dark:fill-orange-400 dark:text-orange-300 absolute bottom-0 left-4 animate-celebration-star"
        style={{ animationDelay: '150ms, 1050ms' }}
      />
      <Star
        className="w-3.5 h-3.5 fill-amber-400 text-amber-500 absolute top-11 -right-1 animate-celebration-star"
        style={{ animationDelay: '290ms, 1180ms' }}
      />

      {/* Central Achievement Medallion */}
      <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-[#FF5A00] dark:from-emerald-500 dark:via-emerald-600 dark:to-orange-600 text-white shadow-lg shadow-orange-600/20 dark:shadow-emerald-950/60 flex items-center justify-center animate-celebration-badge">
        {variant === 'achievement' ? (
          <Award className="w-10 h-10 stroke-[2]" />
        ) : (
          <CheckCircle2 className="w-10 h-10 stroke-[2]" />
        )}
        <span className="absolute -bottom-1.5 -left-1.5 w-7 h-7 rounded-xl bg-amber-400 dark:bg-amber-500 text-slate-950 flex items-center justify-center shadow-sm border-2 border-white dark:border-slate-900">
          <Star className="w-3.5 h-3.5 fill-slate-950" />
        </span>
      </div>
    </div>
  );
}

export interface CompletedOrderSummaryData {
  request: ServiceRequest;
  quote?: ServiceQuote;
  rating: number;
  ratingBreakdown?: RatingBreakdown;
  review: string;
  savingsPercent: number;
  savingsAmountEGP: number;
}

interface OrderCompletionModalProps {
  summary: CompletedOrderSummaryData | null;
  onClose: () => void;
  onNewRequest: () => void;
}

export function OrderCompletionModal({
  summary,
  onClose,
  onNewRequest,
}: OrderCompletionModalProps) {
  if (!summary) return null;

  const { request, quote, rating, ratingBreakdown, review, savingsPercent, savingsAmountEGP } =
    summary;
  const activeBreakdown = ratingBreakdown || request.ratingBreakdown;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/65 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-completion-title"
    >
      <div className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="sm:hidden w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 shrink-0" />

        {/* Modal Top Close Row */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-4 pb-2 shrink-0">
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 tabular-nums">
            شارة إتمام الطلب · #{request.referenceCode}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق ملخص الإتمام"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 sm:px-6 pb-6 pt-1 space-y-5 overflow-y-auto">
          {/* Joyful Animated Badge + Stars + Reassuring Headline */}
          <div className="text-center space-y-3">
            <CelebrationEmblem variant="achievement" />

            <div className="space-y-1.5">
              <h2
                id="order-completion-title"
                className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 text-balance"
              >
                تم إتمام الخدمة بنجاح!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                نشكرك على ثقتك في تطبيق خدمات — تم توثيق تنفيذ الخدمة وحفظ تقييمك بأمان.
              </p>
            </div>

            {activeBreakdown ? (
              <div className="grid grid-cols-3 gap-2 max-w-md mx-auto bg-amber-50/70 dark:bg-amber-950/35 border border-amber-200/80 dark:border-amber-800/70 rounded-xl p-2.5 text-center tabular-nums">
                <div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400">
                    الالتزام بالموعد
                  </div>
                  <div className="text-xs font-extrabold text-amber-900 dark:text-amber-200">
                    {activeBreakdown.punctuality}/5
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400">نظافة العمل</div>
                  <div className="text-xs font-extrabold text-amber-900 dark:text-amber-200">
                    {activeBreakdown.cleanliness}/5
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400">الاحترافية</div>
                  <div className="text-xs font-extrabold text-amber-900 dark:text-amber-200">
                    {activeBreakdown.professionalism}/5
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/70"
                aria-label={`تقييمك المسجل ${rating} من 5 نجوم`}
              >
                {[1, 2, 3, 4, 5].map((starIdx) => (
                  <Star
                    key={starIdx}
                    className={`w-4 h-4 transition-transform ${
                      starIdx <= rating
                        ? 'fill-amber-500 text-amber-500 animate-celebration-badge'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                    style={{ animationDelay: `${120 + starIdx * 55}ms` }}
                  />
                ))}
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 mr-1.5 tabular-nums">
                  {rating}/5 تقييمك للفني
                </span>
              </div>
            )}
          </div>

          {/* Quick Service Summary Card */}
          <div className="animate-celebration-summary bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                ملخص سريع للخدمة المقدمة
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>طلب مكتمل</span>
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-500 dark:text-slate-400 shrink-0">الخدمة:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-left">
                  {request.serviceTitle} · {request.categoryName}
                </span>
              </div>

              {quote && (
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-400 inline-flex items-center gap-1 shrink-0">
                    <UserCheck className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400" />
                    <span>الفني المنفذ:</span>
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-left">
                    {quote.technicianName}
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-500 dark:text-slate-400 inline-flex items-center gap-1 shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400" />
                  <span>العنوان:</span>
                </span>
                <span className="text-slate-700 dark:text-slate-300 text-left">
                  {request.district} — {request.addressText}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-500 dark:text-slate-400 inline-flex items-center gap-1 shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400" />
                  <span>الموعد:</span>
                </span>
                <span className="text-slate-700 dark:text-slate-300 text-left">
                  {quote?.estimatedArrival || `${request.preferredDate} · ${request.preferredTime}`}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-500 dark:text-slate-400 inline-flex items-center gap-1 shrink-0">
                  {request.paymentMethod === 'wallet' ? (
                    <Wallet className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400" />
                  ) : (
                    <Banknote className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400" />
                  )}
                  <span>الدفع:</span>
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200 text-left">
                  {getPaymentMethodLabel(request.paymentMethod, request.walletProvider)}
                </span>
              </div>

              {quote?.warrantyLabel && (
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-400 inline-flex items-center gap-1 shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400" />
                    <span>الضمان المشمول:</span>
                  </span>
                  <span className="font-semibold text-orange-700 dark:text-orange-400 text-left">
                    {quote.warrantyLabel}
                  </span>
                </div>
              )}

              {quote &&
                (() => {
                  const { finalPriceEGP, promoDiscountEGP } = computeDiscountedPrice(
                    quote.priceEGP,
                    request.discountPercent,
                    request.maxDiscountEGP,
                    request.loyaltyDiscountEGP || 0
                  );
                  return (
                    <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                      {(request.promoCode ||
                        (request.loyaltyDiscountEGP && request.loyaltyDiscountEGP > 0)) &&
                        promoDiscountEGP > 0 && (
                          <div className="flex items-center justify-between gap-3 text-emerald-700 dark:text-emerald-400 font-semibold">
                            <span className="inline-flex items-center gap-1">
                              <Tag className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                {request.promoCode && request.loyaltyDiscountEGP
                                  ? `خصم ${request.promoCode} + نقاط خدمات:`
                                  : request.loyaltyDiscountEGP
                                    ? 'خصم نقاط خدمات:'
                                    : `خصم كود ${request.promoCode}:`}
                              </span>
                            </span>
                            <span className="tabular-nums">- {formatEGP(promoDiscountEGP)}</span>
                          </div>
                        )}
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          التكلفة النهائية:
                        </span>
                        <span className="text-lg font-extrabold text-orange-700 dark:text-orange-400 tabular-nums">
                          {formatEGP(finalPriceEGP)}
                        </span>
                      </div>
                    </div>
                  );
                })()}

              {savingsPercent >= 1 && savingsAmountEGP > 0 && (
                <div className="bg-emerald-100/90 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/80 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-emerald-950 dark:text-emerald-100 font-bold">
                  <span className="inline-flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                    <span>التوفير المحقق في هذا الطلب:</span>
                  </span>
                  <span className="tabular-nums">
                    {savingsPercent}% ({formatEGP(savingsAmountEGP)})
                  </span>
                </div>
              )}

              {!request.isWarrantyClaim && (
                <div className="bg-orange-50/80 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/80 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-orange-900 dark:text-orange-200 font-bold">
                  <span className="inline-flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#ea580c] dark:text-orange-400 shrink-0" />
                    <span>نقاط خدمات المكتسبة:</span>
                  </span>
                  <span className="tabular-nums text-[#ea580c] dark:text-orange-400">
                    +
                    {request.pointsAwarded ||
                      KHADAMAT_POINTS_PER_COMPLETED_ORDER +
                        (rating > 0 ? KHADAMAT_BONUS_POINTS_FOR_RATING : 0)}{' '}
                    نقطة
                  </span>
                </div>
              )}

              {review && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 leading-relaxed">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    رأيك المسجل:{' '}
                  </span>
                  <span>«{review}»</span>
                </div>
              )}

              <div className="pt-2">
                <DigitalWarrantyCard request={request} quote={quote} compact />
              </div>
            </div>
          </div>

          {/* Final Reassuring Actions */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[46px] px-5 py-2.5 bg-[#FF5A00] hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer shadow-sm shadow-orange-600/15"
            >
              تم — عرض سجل الطلبات
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onNewRequest();
              }}
              className="min-h-[46px] px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              طلب خدمة جديدة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
