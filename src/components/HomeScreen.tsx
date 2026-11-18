import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Heart,
  MapPin,
  Navigation,
  Search,
  Star,
  Tag,
  Timer,
  Wrench,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  CUSTOMER_TESTIMONIALS,
  SEASONAL_BUNDLES,
  SERVICE_CATEGORIES,
  SERVICES_CATALOG,
  computeFeaturedTechnicians,
  computeServiceMarketStats,
  formatEGP,
} from '../data/khadamatData';
import {
  LocationEntry,
  SeasonalBundle,
  ServiceCategory,
  ServiceItem,
  ServiceQuote,
  ServiceRequest,
  ServiceRequestStatus,
  Technician,
  TechnicianReview,
  UserProfile,
} from '../types/khadamat';
import { CategoryIcon } from './CategoryIcon';
import { computeLiveTripMetrics } from './LiveTechnicianRouteMap';
import { ServiceImage } from './ServiceImage';

interface HomeScreenProps {
  user?: UserProfile;
  district: string;
  locations: LocationEntry[];
  technicians: Technician[];
  reviews: TechnicianReview[];
  quotes: ServiceQuote[];
  requests: ServiceRequest[];
  isDark?: boolean;
  favoriteServiceIds?: string[];
  onToggleFavoriteService?: (serviceId: string) => void;
  onOpenLocation: () => void;
  onSelectDistrict: (district: string) => void;
  onSelectCategory: (categoryId: string) => void;
  onRequestService: (service?: ServiceItem, categoryId?: string) => void;
  onRequestBundle?: (bundle: SeasonalBundle) => void;
  onOpenRequests?: (targetTab?: 'open' | 'active' | 'history') => void;
  onRequestWarrantyCheck?: (request: ServiceRequest, quote?: ServiceQuote) => void;
  onViewTechnicianStats: (technicianId: string) => void;
  onOpenAllServices: (initialQuery?: string) => void;
  onOpenSmartPlanner?: () => void;
  onDispatchEmergency: (req: ServiceRequest) => void;
}

const TRACKING_STEPS: { id: Exclude<ServiceRequestStatus, 'cancelled'>; label: string }[] = [
  { id: 'open_for_quotes', label: 'عروض' },
  { id: 'quote_accepted', label: 'تأكيد' },
  { id: 'en_route', label: 'في الطريق' },
  { id: 'in_progress', label: 'تنفيذ' },
  { id: 'completed', label: 'مكتمل' },
];

export function HomeScreen({
  user,
  district,
  technicians,
  reviews,
  quotes,
  requests,
  favoriteServiceIds = [],
  onToggleFavoriteService,
  onOpenLocation,
  onRequestService,
  onRequestBundle,
  onOpenRequests,
  onViewTechnicianStats,
  onOpenAllServices,
  onDispatchEmergency,
}: HomeScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('all');
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isOffersOpen, setIsOffersOpen] = useState(false);
  const [copiedPromoCode, setCopiedPromoCode] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 10000);
    return () => window.clearInterval(timer);
  }, []);

  const activeTrackingRequest = useMemo(() => {
    const active = requests.filter(
      (r) =>
        r.status === 'open_for_quotes' ||
        r.status === 'quote_accepted' ||
        r.status === 'en_route' ||
        r.status === 'in_progress'
    );
    if (active.length === 0) return null;
    const priority: Record<string, number> = {
      en_route: 0,
      in_progress: 1,
      quote_accepted: 2,
      open_for_quotes: 3,
    };
    return [...active].sort(
      (a, b) => (priority[a.status] ?? 9) - (priority[b.status] ?? 9)
    )[0];
  }, [requests]);

  const displayedServices = useMemo(() => {
    if (selectedCatFilter === 'all') {
      return SERVICES_CATALOG.filter((s) => s.isPopular).slice(0, 8);
    }
    return SERVICES_CATALOG.filter((s) => s.categoryId === selectedCatFilter);
  }, [selectedCatFilter]);

  const featuredTechnicians = useMemo(
    () => computeFeaturedTechnicians(technicians, reviews, quotes, requests).slice(0, 3),
    [technicians, reviews, quotes, requests]
  );

  const quickSearchResults = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return [];
    return SERVICES_CATALOG.filter(
      (s) =>
        s.title.includes(q) ||
        s.summary.includes(q) ||
        SERVICE_CATEGORIES.find((c) => c.id === s.categoryId)?.name.includes(q)
    ).slice(0, 5);
  }, [searchQuery]);

  const handleInstantEmergencyDispatch = (category: ServiceCategory) => {
    const firstService = SERVICES_CATALOG.find((s) => s.categoryId === category.id);
    const refCode = `EM-${Math.floor(10000 + Math.random() * 89999)}`;

    const urgentReq: ServiceRequest = {
      id: `req-${Date.now()}`,
      referenceCode: refCode,
      categoryId: category.id,
      categoryName: category.name,
      serviceTitle: firstService ? firstService.title : category.name,
      detailedDescription: `طلب طارئ — ${category.name}`,
      district,
      addressText: district,
      preferredDate: 'اليوم',
      preferredTime: 'فوراً',
      urgency: 'urgent',
      customerName: user?.name || 'عميل خدمات',
      customerPhone: user?.phone || '01012345678',
      status: 'open_for_quotes',
      paymentMethod: 'cash',
      createdAt: 'الآن',
      createdAtTimestamp: Date.now(),
    };

    onDispatchEmergency(urgentReq);
    setIsEmergencyOpen(false);
    if (onOpenRequests) {
      onOpenRequests('open');
    }
  };

  const handleCopyPromo = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {}
    setCopiedPromoCode(code);
    window.setTimeout(() => setCopiedPromoCode(null), 1800);
  };

  return (
    <div className="max-w-3xl mx-auto px-3.5 py-3.5 space-y-4 pb-10">
      {/* Compact Top Location & Search */}
      <div className="space-y-2.5">
        <div className="hidden md:flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onOpenLocation}
            className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200 hover:text-[#FF5A00] cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-[#FF5A00]" />
            <span>{district}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <span className="text-orange-700 dark:text-orange-400 font-semibold">
            عروض سريعة
          </span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن خدمة: سباكة، تكييف، كهرباء..."
            className="w-full h-10 pr-9 pl-3 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-[#FF5A00] focus:outline-none"
          />

          {quickSearchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-[44px] z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
              {quickSearchResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    onRequestService(item);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-right hover:bg-orange-50/50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </span>
                  <span className="text-[11px] font-bold text-[#FF5A00] shrink-0 mr-2">
                    اطلب
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2 Compact Cards: خدمة طارئة + عروض */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => setIsEmergencyOpen(true)}
          className="bg-gradient-to-l from-red-600 to-[#FF5A00] text-white rounded-2xl p-3.5 text-right flex items-center justify-between gap-2 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
        >
          <div className="min-w-0">
            <div className="text-sm font-extrabold leading-tight">خدمة طارئة</div>
            <div className="text-[11px] text-orange-100 mt-0.5 truncate">
              اختر الخدمة فوراً
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setIsOffersOpen(true)}
          className="bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-800/70 rounded-2xl p-3.5 text-right flex items-center justify-between gap-2 shadow-sm hover:border-[#FF5A00] active:scale-[0.98] transition-all cursor-pointer"
        >
          <div className="min-w-0">
            <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
              عروض
            </div>
            <div className="text-[11px] text-[#FF5A00] dark:text-orange-400 font-semibold mt-0.5 truncate">
              {SEASONAL_BUNDLES.length} عروض · حتى 15%
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-[#FF5A00] dark:text-orange-400 flex items-center justify-center shrink-0">
            <Tag className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* Compact Active Order Card */}
      {activeTrackingRequest && (() => {
        const reqQuotes = quotes.filter((q) => q.requestId === activeTrackingRequest.id);
        const acceptedQuote = reqQuotes.find(
          (q) => q.id === activeTrackingRequest.acceptedQuoteId || q.status === 'accepted'
        );
        const currentStageIndex = TRACKING_STEPS.findIndex(
          (s) => s.id === activeTrackingRequest.status
        );
        const liveTrip =
          activeTrackingRequest.status === 'en_route' && acceptedQuote
            ? computeLiveTripMetrics(activeTrackingRequest, acceptedQuote, technicians, nowMs)
            : null;

        return (
          <div
            onClick={() =>
              onOpenRequests?.(
                activeTrackingRequest.status === 'open_for_quotes' ? 'open' : 'active'
              )
            }
            className="bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-800/70 rounded-2xl p-3.5 space-y-2.5 shadow-sm cursor-pointer hover:border-[#FF5A00] transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#FF5A00] text-white flex items-center justify-center shrink-0">
                  {activeTrackingRequest.status === 'en_route' ? (
                    <Navigation className="w-4 h-4" />
                  ) : activeTrackingRequest.status === 'in_progress' ? (
                    <Wrench className="w-4 h-4" />
                  ) : activeTrackingRequest.status === 'quote_accepted' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Timer className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {activeTrackingRequest.serviceTitle}
                  </div>
                  <div className="text-[11px] text-orange-700 dark:text-orange-400 font-semibold truncate tabular-nums">
                    {activeTrackingRequest.status === 'en_route' && liveTrip
                      ? `في الطريق · ${liveTrip.etaMinutes} د`
                      : activeTrackingRequest.status === 'open_for_quotes'
                      ? `${reqQuotes.length} عروض متاحة`
                      : acceptedQuote?.technicianName || 'جاري المتابعة'}
                  </div>
                </div>
              </div>

              <span className="px-2.5 py-1.5 rounded-lg bg-[#FF5A00] text-white text-[11px] font-bold inline-flex items-center gap-1 shrink-0">
                <span>متابعة</span>
                <ArrowLeft className="w-3 h-3" />
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1">
              {TRACKING_STEPS.map((st, idx) => (
                <div
                  key={st.id}
                  className={`h-1 rounded-full ${
                    idx <= currentStageIndex
                      ? 'bg-[#FF5A00]'
                      : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
        );
      })()}

      {/* Unified Section: الخدمات (Merged Categories + Popular Services with Images) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">
            الخدمات
          </h2>
          <button
            type="button"
            onClick={() => onOpenAllServices('')}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#FF5A00] dark:text-orange-400 cursor-pointer"
          >
            <span>عرض الكل</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          <button
            type="button"
            onClick={() => setSelectedCatFilter('all')}
            className={`h-8 px-3 rounded-full text-xs font-bold whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
              selectedCatFilter === 'all'
                ? 'bg-[#FF5A00] text-white border-[#FF5A00]'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
            }`}
          >
            الأكثر طلباً
          </button>
          {SERVICE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCatFilter(cat.id)}
              className={`h-8 px-3 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 border inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                selectedCatFilter === cat.id
                  ? 'bg-[#FF5A00] text-white border-[#FF5A00]'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
              }`}
            >
              <CategoryIcon iconKey={cat.iconKey} className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Services Grid With Photos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {displayedServices.map((service) => {
            const cat = SERVICE_CATEGORIES.find((c) => c.id === service.categoryId);
            const marketStats = computeServiceMarketStats(
              service.title,
              quotes,
              requests,
              reviews
            );
            const isFavorite = favoriteServiceIds.includes(service.id);

            return (
              <article
                key={service.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-[#FF5A00]/60 transition-colors"
              >
                <div>
                  <div className="relative aspect-[16/10] w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <ServiceImage
                      src={service.imageUrl}
                      alt={service.title}
                      iconKey={cat?.iconKey || 'carpentry'}
                      className="w-full h-full"
                    />
                    {onToggleFavoriteService && (
                      <button
                        type="button"
                        onClick={() => onToggleFavoriteService(service.id)}
                        aria-label="مفضلة"
                        className="absolute top-1.5 left-1.5 w-7 h-7 rounded-lg bg-white/90 dark:bg-slate-900/90 flex items-center justify-center cursor-pointer"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            isFavorite
                              ? 'fill-rose-500 text-rose-500'
                              : 'text-slate-500'
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  <div className="p-2.5 space-y-1">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                      {service.title}
                    </h3>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                      <span className="inline-flex items-center gap-0.5 text-slate-700 dark:text-slate-200 font-semibold">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {service.rating}
                      </span>
                      <span className="truncate">
                        {marketStats.lowestOfferEGP
                          ? `من ${formatEGP(marketStats.lowestOfferEGP)}`
                          : service.estimatedDuration}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-2.5 pb-2.5">
                  <button
                    type="button"
                    onClick={() => onRequestService(service)}
                    className="w-full h-8 bg-[#FF5A00] hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    اطلب
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Merged Section: فنيون مميزون وآراء العملاء (Ultra-Short) */}
      <section className="space-y-2.5">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">
          فنيون مميزون وآراء العملاء
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {featuredTechnicians.map((entry, idx) => {
            const { technician: tech, effectiveRating, effectiveCompletedJobs } = entry;
            const testimonial = CUSTOMER_TESTIMONIALS[idx];

            return (
              <article
                key={tech.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#FF5A00] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {tech.isCompany ? <Building2 className="w-4 h-4" /> : tech.initials}
                    </div>
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onViewTechnicianStats(tech.id)}
                        className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate block hover:text-[#FF5A00] cursor-pointer"
                      >
                        {tech.name}
                      </button>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                        <span className="inline-flex items-center gap-0.5 text-slate-700 dark:text-slate-200 font-bold">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {effectiveRating.toFixed(1)}
                        </span>
                        <span>·</span>
                        <span>{effectiveCompletedJobs} مهمة</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRequestService(undefined, tech.categoryIds[0])}
                    className="h-7 px-2.5 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-[#FF5A00] dark:text-orange-400 text-[11px] font-bold shrink-0 cursor-pointer"
                  >
                    طلب
                  </button>
                </div>

                {testimonial && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-800 line-clamp-2 leading-relaxed">
                    «{testimonial.quote}» —{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {testimonial.author}
                    </strong>
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* Emergency Service Quick-Select Modal (Zero Details, 1-Tap Dispatch) */}
      {isEmergencyOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/65 backdrop-blur-sm p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsEmergencyOpen(false)}
        >
          <div
            className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 max-h-[82vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-red-600 dark:text-red-400">
                  خدمة طارئة
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  اختر الخدمة — إشعار فوري للفنيين بدون تفاصيل
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEmergencyOpen(false)}
                aria-label="إغلاق"
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto py-1">
              {SERVICE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleInstantEmergencyDispatch(cat)}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 hover:border-red-500 hover:bg-red-50/60 dark:hover:bg-red-950/40 flex flex-col items-center justify-center gap-1.5 text-center transition-colors cursor-pointer active:scale-95"
                >
                  <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center">
                    <CategoryIcon iconKey={cat.iconKey} className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Offers Modal («عروض») */}
      {isOffersOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/65 backdrop-blur-sm p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsOffersOpen(false)}
        >
          <div
            className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#FF5A00]" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  عروض وخصومات
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOffersOpen(false)}
                aria-label="إغلاق"
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 overflow-y-auto py-1">
              {SEASONAL_BUNDLES.map((bundle) => {
                const targetService = SERVICES_CATALOG.find(
                  (s) => s.id === bundle.serviceId
                );
                const isCopied = copiedPromoCode === bundle.promoCode;
                return (
                  <div
                    key={bundle.id}
                    className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {bundle.title}
                      </h4>
                      <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 shrink-0">
                        خصم {bundle.discountPercent}%
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {bundle.subtitle}
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleCopyPromo(bundle.promoCode)}
                        className="h-8 px-2.5 rounded-lg bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 text-[11px] font-bold text-orange-800 dark:text-orange-300 inline-flex items-center gap-1 cursor-pointer"
                      >
                        {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span dir="ltr">{bundle.promoCode}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsOffersOpen(false);
                          if (onRequestBundle) {
                            onRequestBundle(bundle);
                          } else {
                            onRequestService(targetService, bundle.categoryId);
                          }
                        }}
                        className="flex-1 h-8 rounded-lg bg-[#FF5A00] hover:bg-orange-700 text-white text-xs font-bold cursor-pointer"
                      >
                        احجز العرض
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
