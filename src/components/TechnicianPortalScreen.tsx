import {
  Banknote,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Lock,
  MapPin,
  MessageCircle,
  MessageSquare,
  Navigation,
  Phone,
  Repeat,
  Send,
  ShieldCheck,
  Star,
  Tag,
  Timer,
  Wallet,
  Wrench,
  X,
  ZoomIn,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  buildWhatsAppLink,
  computeDiscountedPrice,
  formatEGP,
  getFastQuoteWindowStatus,
  getPaymentMethodLabel,
  getRecurrenceLabel,
} from '../data/khadamatData';
import {
  RequestMessage,
  ServiceQuote,
  ServiceRequest,
  Technician,
  TechnicianTab,
  UserRole,
} from '../types/khadamat';
import { AndroidApkGuideCard } from './PWAInstallBanner';

interface TechnicianPortalScreenProps {
  activeTab: Exclude<TechnicianTab, 'notifications' | 'tech_stats'>;
  technician: Technician;
  requests: ServiceRequest[];
  quotes: ServiceQuote[];
  messages: RequestMessage[];
  onSubmitQuote: (
    requestId: string,
    priceEGP: number,
    estimatedArrival: string,
    notes: string,
    warrantyLabel?: string
  ) => void;
  onUpdateJobStatus: (
    requestId: string,
    nextStatus: 'en_route' | 'in_progress' | 'completed'
  ) => void;
  onSendMessage: (
    requestId: string,
    technicianId: string,
    technicianName: string,
    senderRole: UserRole,
    text: string
  ) => void;
  onOpenLocation: () => void;
  onSwitchAccount: () => void;
}

const WARRANTY_PRESETS = [
  'ضمان 30 يوماً',
  'ضمان 14 يوماً',
  'ضمان 7 أيام',
  'حسب الفحص',
];

export function TechnicianPortalScreen({
  activeTab,
  technician,
  requests,
  quotes,
  messages,
  onSubmitQuote,
  onUpdateJobStatus,
  onSendMessage,
  onOpenLocation,
  onSwitchAccount,
}: TechnicianPortalScreenProps) {
  const [filterScope, setFilterScope] = useState<'specialty' | 'all'>('specialty');
  const [activeFormReqId, setActiveFormReqId] = useState<string | null>(null);
  const [activeChatReqId, setActiveChatReqId] = useState<string | null>(null);
  const [techChatInput, setTechChatInput] = useState<string>('');
  const [priceInput, setPriceInput] = useState<string>('');
  const [arrivalInput, setArrivalInput] = useState<string>('اليوم خلال ساعتين');
  const [warrantyInput, setWarrantyInput] = useState<string>(WARRANTY_PRESETS[0]);
  const [notesInput, setNotesInput] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [previewGallery, setPreviewGallery] = useState<{
    photos: string[];
    index: number;
    serviceTitle: string;
  } | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const openRequests = useMemo(() => {
    return requests.filter((req) => {
      if (req.status !== 'open_for_quotes') return false;
      if (filterScope === 'specialty') {
        return technician.categoryIds.includes(req.categoryId);
      }
      return true;
    });
  }, [requests, filterScope, technician.categoryIds]);

  const acceptedJobs = useMemo(() => {
    return requests.filter((req) => {
      if (
        req.status !== 'quote_accepted' &&
        req.status !== 'en_route' &&
        req.status !== 'in_progress'
      ) {
        return false;
      }
      const acceptedQuote = quotes.find(
        (q) => q.id === req.acceptedQuoteId || (q.requestId === req.id && q.status === 'accepted')
      );
      return acceptedQuote?.technicianId === technician.id;
    });
  }, [requests, quotes, technician.id]);

  const completedJobs = useMemo(() => {
    return requests.filter((req) => {
      if (req.status !== 'completed') return false;
      const acceptedQuote = quotes.find(
        (q) => q.id === req.acceptedQuoteId || (q.requestId === req.id && q.status === 'accepted')
      );
      return acceptedQuote?.technicianId === technician.id;
    });
  }, [requests, quotes, technician.id]);

  const handleQuoteSubmit = (e: React.FormEvent, requestId: string) => {
    e.preventDefault();
    const numericPrice = Number(priceInput);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setFormError('يرجى إدخال قيمة العرض بالجنيه المصري بشكل صحيح.');
      return;
    }
    if (notesInput.trim().length < 5) {
      setFormError('يرجى كتابة ملاحظة توضح ما يشمله العرض للعميل.');
      return;
    }
    setFormError('');
    onSubmitQuote(
      requestId,
      numericPrice,
      arrivalInput.trim() || 'حسب الموعد المفضل للعميل',
      notesInput.trim(),
      warrantyInput
    );
    setActiveFormReqId(null);
    setPriceInput('');
    setNotesInput('');
  };

  const renderFaultPhotos = (photos?: string[], serviceTitle = 'طلب خدمة') => {
    if (!photos || photos.length === 0) return null;
    return (
      <div className="bg-orange-50/55 dark:bg-slate-800/75 border border-orange-200/80 dark:border-slate-700 rounded-xl p-3.5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
            <Camera className="w-4 h-4 text-[#FF5A00] dark:text-orange-400 shrink-0" />
            <span className="tabular-nums">
              صور العطل المرفقة للتقييم الدقيق ({photos.length})
            </span>
          </div>
          <span className="text-[11px] font-medium text-orange-800 dark:text-orange-300">
            اضغط على الصورة للتكبير وفحص التفاصيل
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {photos.map((photo, idx) => (
            <button
              key={`tech-photo-${idx}`}
              type="button"
              onClick={() => setPreviewGallery({ photos, index: idx, serviceTitle })}
              aria-label={`تكبير صورة العطل ${idx + 1} من ${photos.length}`}
              className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 hover:border-[#FF5A00] dark:hover:border-orange-500 transition-colors cursor-pointer"
            >
              <img
                src={photo}
                alt={`صورة العطل ${idx + 1} لطلب ${serviceTitle}`}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
              />
              <div className="absolute inset-x-0 bottom-0 px-2.5 py-1.5 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent flex items-center justify-between text-[11px] font-semibold text-white">
                <span className="tabular-nums">صورة {idx + 1}</span>
                <span className="inline-flex items-center gap-1">
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>تكبير</span>
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const activePreviewPhoto =
    previewGallery && previewGallery.photos[previewGallery.index]
      ? previewGallery.photos[previewGallery.index]
      : null;

  const photoModal =
    previewGallery && activePreviewPhoto ? (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
        onClick={() => setPreviewGallery(null)}
      >
        <div
          className="relative max-w-2xl w-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                معاينة العطل — {previewGallery.serviceTitle}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                صورة {previewGallery.index + 1} من {previewGallery.photos.length} لتحديد التكلفة وقطع الغيار بدقة
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPreviewGallery(null)}
              aria-label="إغلاق المعاينة"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative bg-slate-950 flex items-center justify-center max-h-[72vh] min-h-[240px]">
            <img
              src={activePreviewPhoto}
              alt={`صورة العطل ${previewGallery.index + 1} بالحجم الكامل`}
              className="max-h-[72vh] w-auto object-contain"
            />
          </div>
          {previewGallery.photos.length > 1 && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <button
                type="button"
                onClick={() =>
                  setPreviewGallery((prev) =>
                    prev
                      ? {
                          ...prev,
                          index:
                            (prev.index - 1 + prev.photos.length) % prev.photos.length,
                        }
                      : null
                  )
                }
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:border-[#FF5A00] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
                <span>الصورة السابقة</span>
              </button>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                {previewGallery.index + 1} / {previewGallery.photos.length}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPreviewGallery((prev) =>
                    prev
                      ? {
                          ...prev,
                          index: (prev.index + 1) % prev.photos.length,
                        }
                      : null
                  )
                }
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:border-[#FF5A00] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>الصورة التالية</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    ) : null;

  if (activeTab === 'tech_profile') {
    return (
      <>
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 pb-14">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FF5A00] dark:bg-orange-600 text-white font-bold text-lg flex items-center justify-center shrink-0">
                {technician.isCompany ? <Building2 className="w-7 h-7" /> : technician.initials}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{technician.name}</h1>
                  {technician.isVerifiedDocs && (
                    <ShieldCheck className="w-4 h-4 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                  )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{technician.specialty}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5 tabular-nums">
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    {technician.rating} ({technician.reviewsCount} تقييم)
                  </span>
                  <span>·</span>
                  <span>{technician.completedJobs} مهمة مكتملة</span>
                  <span>·</span>
                  <span>{technician.area}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onOpenLocation}
                className="px-4 py-2.5 min-h-[44px] bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 text-xs font-semibold rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/60 transition-colors cursor-pointer"
              >
                إضافة / تعديل المنطقة
              </button>
              <button
                type="button"
                onClick={onSwitchAccount}
                className="px-5 py-2.5 min-h-[44px] bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-700 border border-transparent dark:border-slate-700 transition-colors cursor-pointer"
              >
                تبديل الحساب / تسجيل الخروج
              </button>
            </div>
          </div>

          {/* Official Documents & Phone Verification Card */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  المستندات الرسمية والتوثيق
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  رقم الموبايل ({technician.phone}) موثق برمز OTP · مركز العمل الأساسي: {technician.primaryCenter}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 dark:text-orange-400">
                <ShieldCheck className="w-4 h-4" />
                <span>حساب موثق</span>
              </span>
            </div>

            {technician.documents && technician.documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {technician.documents.map((doc) => (
                  <div
                    key={`${doc.type}-${doc.fileName}`}
                    className="border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 flex items-center gap-3 bg-slate-50/70 dark:bg-slate-800/60"
                  >
                    {doc.previewDataUrl ? (
                      <img
                        src={doc.previewDataUrl}
                        alt={doc.label}
                        className="w-11 h-11 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-[#FF5A00] dark:text-orange-400 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{doc.label}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {doc.fileName} · {doc.fileSizeLabel}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">تم التحقق من بيانات الحساب الأساسية.</p>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              المهام المكتملة وتقييمات العملاء ({completedJobs.length})
            </h2>

            {completedJobs.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                لم تكتمل مهام لهذا الحساب بعد. قدّم عروضاً على الطلبات الجديدة للبدء.
              </div>
            ) : (
              <div className="space-y-3">
                {completedJobs.map((job) => {
                  const acceptedQuote = quotes.find((q) => q.id === job.acceptedQuoteId);
                  return (
                    <div
                      key={job.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                            #{job.referenceCode} · {job.district}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{job.serviceTitle}</h3>
                        </div>
                        {acceptedQuote && (
                          <span className="text-base font-bold text-orange-700 dark:text-orange-400 tabular-nums">
                            {formatEGP(acceptedQuote.priceEGP)}
                          </span>
                        )}
                      </div>

                      {job.rating ? (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                            <span>تقييم العميل ({job.customerName}):</span>
                            <span className="inline-flex items-center gap-0.5 text-amber-500">
                              {Array.from({ length: job.rating }).map((_, idx) => (
                                <Star key={idx} className="w-3.5 h-3.5 fill-amber-500" />
                              ))}
                            </span>
                          </div>
                          {job.review && <p className="text-slate-600 dark:text-slate-400">«{job.review}»</p>}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 dark:text-slate-500">بانتظار تقييم العميل للخدمة</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <AndroidApkGuideCard />
        </div>
        {photoModal}
      </>
    );
  }

  if (activeTab === 'accepted_jobs') {
    return (
      <>
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 pb-14">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
              الطلبات المقبولة
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              حدث حالة الزيارة لحظياً («في الطريق» ثم «بدء التنفيذ») وتواصل مع العميل مباشرة
            </p>
          </div>

          {acceptedJobs.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-2">
              <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                لا توجد طلبات مقبولة حالياً
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                تظهر الطلبات هنا فور موافقة العميل على عرضك
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {acceptedJobs.map((job) => {
                const myQuote = quotes.find(
                  (q) => q.id === job.acceptedQuoteId || (q.requestId === job.id && q.status === 'accepted')
                );
                const promoCalc = myQuote
                  ? computeDiscountedPrice(
                      myQuote.priceEGP,
                      job.discountPercent,
                      job.maxDiscountEGP,
                      job.loyaltyDiscountEGP || 0
                    )
                  : null;
                const waHref = buildWhatsAppLink(
                  job.customerPhone,
                  `أهلاً بحضرتك يا ${job.customerName}، معك ${technician.name} بخصوص طلب #${job.referenceCode} (${job.serviceTitle}) على تطبيق خدمات.`
                );

                return (
                  <article
                    key={job.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="text-xs text-orange-700 dark:text-orange-400 font-semibold flex flex-wrap items-center gap-2">
                          <span>
                            {job.status === 'en_route'
                              ? 'في الطريق للعميل حالياً'
                              : job.status === 'in_progress'
                              ? 'جاري تنفيذ الخدمة في الموقع'
                              : 'تمت موافقة العميل على عرضك'}
                          </span>
                          <span>·</span>
                          <span className="tabular-nums">#{job.referenceCode}</span>
                          {job.bundleTitle && (
                            <>
                              <span>·</span>
                              <span className="text-slate-700 dark:text-slate-300">{job.bundleTitle}</span>
                            </>
                          )}
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                          {job.serviceTitle}
                        </h2>
                        {job.isWarrantyClaim && job.warrantyClaimForRef && (
                          <div className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              إعادة فحص ضمان مجاني لطلب #{job.warrantyClaimForRef}
                            </span>
                          </div>
                        )}
                      </div>

                      {myQuote && promoCalc && (
                        <div className="text-right sm:text-left shrink-0">
                          <span className="text-xs text-slate-500 dark:text-slate-400 block">قيمة العرض المقبول</span>
                          <span className="text-xl font-bold text-orange-700 dark:text-orange-400 tabular-nums block">
                            {formatEGP(myQuote.priceEGP)}
                          </span>
                          {promoCalc.promoDiscountEGP > 0 && job.promoCode && (
                            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                              تحصيل العميل بعد {job.promoCode}: {formatEGP(promoCalc.finalPriceEGP)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {job.detailedDescription}
                    </p>

                    {renderFaultPhotos(job.faultPhotos, job.serviceTitle)}

                    {/* Customer Contact & Address Box */}
                    <div className="bg-orange-50/70 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/80 rounded-xl p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-xs text-orange-700 dark:text-orange-400 font-medium block">
                            بيانات العميل المتاحة بعد الموافقة
                          </span>
                          <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                            {job.customerName}
                          </div>
                        </div>
                        <div className="text-base font-bold text-orange-800 dark:text-orange-300 tabular-nums">
                          {job.customerPhone}
                        </div>
                      </div>

                      <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-4 h-4 text-[#FF5A00] dark:text-orange-400 shrink-0 mt-0.5" />
                          <span>
                            {job.district} — {job.addressText}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                          <span>
                            الموعد: {job.preferredDate} · {job.preferredTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
                          {job.paymentMethod === 'wallet' ? (
                            <Wallet className="w-4 h-4 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                          ) : (
                            <Banknote className="w-4 h-4 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                          )}
                          <span>
                            طريقة الدفع:{' '}
                            {getPaymentMethodLabel(job.paymentMethod, job.walletProvider)}
                          </span>
                        </div>
                      </div>

                      {/* Direct Phone Call & WhatsApp */}
                      <div className="flex flex-wrap items-center gap-2.5 pt-2">
                        <a
                          href={`tel:${job.customerPhone}`}
                          className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          <span>اتصال بالعميل</span>
                        </a>

                        <a
                          href={waHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 bg-[#FF5A00] dark:bg-orange-600 text-white text-xs font-semibold rounded-xl hover:bg-orange-700 dark:hover:bg-orange-500 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>تواصل عبر واتساب</span>
                        </a>
                      </div>
                    </div>

                    {/* Live Technician Tracking & Job Progress Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {job.status === 'quote_accepted'
                          ? 'أبلغ العميل عند تحركك للزيارة لتفعيل التتبع اللحظي'
                          : job.status === 'en_route'
                          ? 'تم إشعار العميل أنك في الطريق إليه الآن'
                          : 'العمل قيد التنفيذ — اضغط «تم إنهاء الخدمة» فور الانتهاء'}
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        {job.status === 'quote_accepted' && (
                          <button
                            type="button"
                            onClick={() => onUpdateJobStatus(job.id, 'en_route')}
                            className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2.5 text-xs font-semibold text-orange-800 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/60 rounded-xl transition-colors cursor-pointer"
                          >
                            <Navigation className="w-4 h-4" />
                            <span>أنا في الطريق للعميل</span>
                          </button>
                        )}

                        {(job.status === 'quote_accepted' || job.status === 'en_route') && (
                          <button
                            type="button"
                            onClick={() => onUpdateJobStatus(job.id, 'in_progress')}
                            className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                          >
                            <Wrench className="w-4 h-4" />
                            <span>بدء التنفيذ في الموقع</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onUpdateJobStatus(job.id, 'completed')}
                          className="inline-flex items-center gap-1.5 min-h-[44px] px-5 py-2.5 text-xs font-semibold text-white bg-[#FF5A00] hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 rounded-xl transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>تم إنهاء الخدمة</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
        {photoModal}
      </>
    );
  }

  // Default Tab: Open Requests (Send Quotes)
  return (
    <>
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 pb-14">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
              طلبات العملاء الجديدة
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              أهلاً {technician.name} — قدّم عرضك سريعاً خلال نافذة الـ 30 دقيقة
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setFilterScope('specialty')}
              className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                filterScope === 'specialty'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              في تخصصي
            </button>
            <button
              type="button"
              onClick={() => setFilterScope('all')}
              className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                filterScope === 'all'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              كل الطلبات
            </button>
          </div>
        </div>

        {openRequests.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
              لا توجد طلبات في تخصصك حالياً
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              جرّب عرض «كل الطلبات» لمتابعة باقي المهام المفتوحة.
            </p>
            <button
              type="button"
              onClick={() => setFilterScope('all')}
              className="mt-2 px-5 py-2.5 min-h-[44px] bg-[#FF5A00] text-white text-xs font-semibold rounded-xl hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 cursor-pointer"
            >
              عرض كل الطلبات المفتوحة
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {openRequests.map((req) => {
              const reqQuotesCount = quotes.filter((q) => q.requestId === req.id).length;
              const mySubmittedQuote = quotes.find(
                (q) => q.requestId === req.id && q.technicianId === technician.id
              );
              const isFormOpen = activeFormReqId === req.id;
              const fastQuote = getFastQuoteWindowStatus(
                req.createdAtTimestamp,
                reqQuotesCount,
                nowMs
              );

              return (
                <article
                  key={req.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                          #{req.referenceCode}
                        </span>
                        <span>·</span>
                        <span>{req.categoryName}</span>
                        <span>·</span>
                        <span>{req.createdAt}</span>
                        {req.urgency === 'urgent' && (
                          <>
                            <span>·</span>
                            <span className="font-bold text-amber-700 dark:text-amber-400">طلب طوارئ</span>
                          </>
                        )}
                        {req.recurrenceFrequency && (
                          <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1 font-semibold text-orange-700 dark:text-orange-400">
                              <Repeat className="w-3 h-3" />
                              <span>
                                طلب دوري ({getRecurrenceLabel(req.recurrenceFrequency)})
                              </span>
                            </span>
                          </>
                        )}
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {req.serviceTitle}
                      </h2>
                      {req.isWarrantyClaim && req.warrantyClaimForRef && (
                        <div className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            طلب إعادة فحص مجاني مشمول بضمان طلب #{req.warrantyClaimForRef}
                          </span>
                        </div>
                      )}
                      {(req.bundleTitle || req.promoCode) && (
                        <div className="mt-1 inline-flex flex-wrap items-center gap-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          <Tag className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {req.bundleTitle ? `${req.bundleTitle}` : 'طلب بكود خصم'}
                            {req.promoCode ? ` (${req.promoCode} - خصم ${req.discountPercent || 0}%)` : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:items-end gap-1 shrink-0">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 dark:text-orange-400 tabular-nums">
                        <Timer className="w-3.5 h-3.5 shrink-0" />
                        <span>{fastQuote.headline}</span>
                      </span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>رقم العميل يظهر بعد الموافقة</span>
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {req.detailedDescription}
                  </p>

                  {renderFaultPhotos(req.faultPhotos, req.serviceTitle)}

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
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
                        الدفع: {getPaymentMethodLabel(req.paymentMethod, req.walletProvider)}
                      </span>
                    </span>
                  </div>

                  {mySubmittedQuote ? (
                    <div className="bg-orange-50/70 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-orange-700 dark:text-orange-400">
                          تم إرسال عرضك للعميل · بانتظار الضغط على «موافق»
                          {mySubmittedQuote.warrantyLabel
                            ? ` · ${mySubmittedQuote.warrantyLabel}`
                            : ''}
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300">{mySubmittedQuote.notes}</p>
                      </div>
                      <span className="text-lg font-bold text-orange-800 dark:text-orange-300 tabular-nums shrink-0">
                        {formatEGP(mySubmittedQuote.priceEGP)}
                      </span>
                    </div>
                  ) : isFormOpen ? (
                    <form
                      onSubmit={(e) => handleQuoteSubmit(e, req.id)}
                      className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3"
                    >
                      {req.faultPhotos && req.faultPhotos.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2.5">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                            <span>مرجع صور العطل أثناء التسعير:</span>
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            {req.faultPhotos.map((photo, idx) => (
                              <button
                                key={`quote-ref-${req.id}-${idx}`}
                                type="button"
                                onClick={() =>
                                  setPreviewGallery({
                                    photos: req.faultPhotos!,
                                    index: idx,
                                    serviceTitle: req.serviceTitle,
                                  })
                                }
                                aria-label={`فتح صورة العطل ${idx + 1} للمعاينة`}
                                className="w-16 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-[#FF5A00] dark:hover:border-orange-500 transition-colors cursor-pointer"
                              >
                                <img
                                  src={photo}
                                  alt={`مرجع العطل ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            السعر المقترح (ج.م) *
                          </label>
                          <input
                            type="number"
                            min={20}
                            required
                            value={priceInput}
                            onChange={(e) => setPriceInput(e.target.value)}
                            placeholder="مثال: 350"
                            className="w-full h-11 px-3.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl tabular-nums focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            موعد الوصول المتوقع
                          </label>
                          <input
                            type="text"
                            value={arrivalInput}
                            onChange={(e) => setArrivalInput(e.target.value)}
                            placeholder="مثال: اليوم الساعة 4:00 عصراً"
                            className="w-full h-11 px-3.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            مدة الضمان
                          </label>
                          <select
                            value={warrantyInput}
                            onChange={(e) => setWarrantyInput(e.target.value)}
                            className="w-full h-11 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none"
                          >
                            {WARRANTY_PRESETS.map((w) => (
                              <option key={w} value={w}>
                                {w}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          تفاصيل العرض للعميل *
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={notesInput}
                          onChange={(e) => setNotesInput(e.target.value)}
                          placeholder="اشرح ما يشمله السعر..."
                          className="w-full p-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none"
                        />
                      </div>

                      {formError && (
                        <p className="text-xs text-red-700 dark:text-red-400 font-medium">{formError}</p>
                      )}

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveFormReqId(null);
                            setFormError('');
                          }}
                          className="min-h-[42px] px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 min-h-[42px] px-5 py-2 text-xs font-semibold text-white bg-[#FF5A00] hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 rounded-xl cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>إرسال العرض للعميل</span>
                        </button>
                      </div>
                    </form>
                  ) : null}

                  {/* Technician-Customer Pre-Acceptance Inquiry Chat */}
                  {(() => {
                    const reqMessages = messages.filter(
                      (m) => m.requestId === req.id && m.technicianId === technician.id
                    );
                    const isChatOpen = activeChatReqId === req.id;

                    return (
                      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveChatReqId(isChatOpen ? null : req.id);
                              setTechChatInput('');
                            }}
                            className={`min-h-[42px] px-4 py-2 text-xs font-semibold rounded-xl border inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                              isChatOpen
                                ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-700 dark:border-slate-600'
                                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#FF5A00] dark:hover:border-orange-500'
                            }`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>
                              مراسلة العميل قبل الموعد
                              {reqMessages.length > 0 ? ` (${reqMessages.length})` : ''}
                            </span>
                          </button>

                          {!mySubmittedQuote && !isFormOpen && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveFormReqId(req.id);
                                setPriceInput('');
                                setNotesInput('');
                                setFormError('');
                              }}
                              className="min-h-[44px] px-5 py-2.5 bg-[#FF5A00] text-white text-xs font-semibold rounded-xl hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 transition-colors cursor-pointer"
                            >
                              تقديم عرض سعر
                            </button>
                          )}
                        </div>

                        {isChatOpen && (
                          <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-2.5">
                            {reqMessages.length === 0 ? (
                              <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-1">
                                اسأل العميل أي تفاصيل فنية قبل إرسال أو تعديل عرضك.
                              </p>
                            ) : (
                              <div className="space-y-2 max-h-44 overflow-y-auto">
                                {reqMessages.map((msg) => (
                                  <div
                                    key={msg.id}
                                    className={`flex flex-col ${
                                      msg.senderRole === 'technician'
                                        ? 'items-start'
                                        : 'items-end'
                                    }`}
                                  >
                                    <div
                                      className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                                        msg.senderRole === 'technician'
                                          ? 'bg-[#FF5A00] dark:bg-orange-600 text-white'
                                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                                      }`}
                                    >
                                      {msg.text}
                                    </div>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 px-1">
                                      {msg.senderRole === 'technician' ? 'أنت' : 'العميل'} ·{' '}
                                      {msg.createdAt}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (!techChatInput.trim()) return;
                                onSendMessage(
                                  req.id,
                                  technician.id,
                                  technician.name,
                                  'technician',
                                  techChatInput
                                );
                                setTechChatInput('');
                              }}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="text"
                                value={techChatInput}
                                onChange={(e) => setTechChatInput(e.target.value)}
                                placeholder="اكتب استفسارك للعميل..."
                                className="flex-1 h-10 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none"
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
                  })()}
                </article>
              );
            })}
          </div>
        )}
      </div>
      {photoModal}
    </>
  );
}
