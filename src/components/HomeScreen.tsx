import {
  ArrowLeft,
  Bell,
  Bot,
  Building2,
  CheckCircle2,
  Heart,
  LayoutGrid,
  Navigation,
  Search,
  Sparkles,
  Star,
  Timer,
  Wrench,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  HERO_IMAGE_PATH,
  SERVICE_CATEGORIES,
  SERVICES_CATALOG,
  computeFeaturedTechnicians,
  computeServiceMarketStats,
  formatEGP,
  getFastQuoteWindowStatus,
} from '../data/khadamatData';
import {
  LocationEntry,
  SeasonalBundle,
  ServiceItem,
  ServiceQuote,
  ServiceRequest,
  ServiceRequestStatus,
  Technician,
  TechnicianReview,
  UserProfile,
} from '../types/khadamat';
import { BrandWordmark } from './BrandWordmark';
import { BundlesModal } from './BundlesModal';
import { EmergencyServicesSection } from './EmergencyServicesSection';
import { computeLiveTripMetrics } from './LiveTechnicianRouteMap';
import { ServiceImage } from './ServiceImage';

interface HomeScreenProps {
  district: string;
  user?: UserProfile;
  locations: LocationEntry[];
  technicians: Technician[];
  reviews: TechnicianReview[];
  quotes: ServiceQuote[];
  requests: ServiceRequest[];
  isDark?: boolean;
  favoriteServiceIds?: string[];
  onToggleFavoriteService?: (serviceId: string) => void;
  onOpenLocation?: () => void;
  onSelectDistrict: (district: string) => void;
  onSelectCategory: (categoryId: string) => void;
  onRequestService: (service?: ServiceItem, categoryId?: string) => void;
  onRequestBundle?: (bundle: SeasonalBundle) => void;
  onOpenRequests?: (targetTab?: 'open' | 'active' | 'history') => void;
  onRequestWarrantyCheck?: (request: ServiceRequest, quote?: ServiceQuote) => void;
  onViewTechnicianStats: (technicianId: string) => void;
  onOpenAllServices: (initialQuery?: string) => void;
  onOpenSmartPlanner: () => void;
  onDispatchEmergency: (req: ServiceRequest) => void;
  onAcceptQuote?: (requestId: string, quoteId: string) => void;
}

const HOME_TRACKING_STEPS: {
  id: Exclude<ServiceRequestStatus, 'cancelled'>;
  label: string;
}[] = [
  { id: 'open_for_quotes', label: 'العروض' },
  { id: 'quote_accepted', label: 'التأكيد' },
  { id: 'en_route', label: 'في الطريق' },
  { id: 'in_progress', label: 'التنفيذ' },
  { id: 'completed', label: 'مكتمل' },
];

export function HomeScreen({
  district,
  user,
  locations,
  technicians,
  reviews,
  quotes,
  requests,
  favoriteServiceIds = [],
  onToggleFavoriteService,
  onRequestService,
  onRequestBundle,
  onOpenRequests,
  onViewTechnicianStats,
  onOpenAllServices,
  onOpenSmartPlanner,
  onDispatchEmergency,
  onAcceptQuote,
}: HomeScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [isBundlesOpen, setIsBundlesOpen] = useState(false);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const activeUser: UserProfile = user || {
    name: 'عميل خدمات',
    phone: '01012345678',
    defaultDistrict: district,
  };

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

  const openOffersAlert = useMemo(() => {
    const openReqs = requests.filter((r) => r.status === 'open_for_quotes');
    let totalOffers = 0;
    let lowestOfferPrice: number | null = null;
    let firstReqWithOffers: ServiceRequest | null = null;

    for (const req of openReqs) {
      const reqQuotes = quotes.filter(
        (q) => q.requestId === req.id && q.status === 'pending'
      );
      if (reqQuotes.length > 0) {
        if (!firstReqWithOffers) firstReqWithOffers = req;
        totalOffers += reqQuotes.length;
        for (const q of reqQuotes) {
          if (q.priceEGP > 0 && (lowestOfferPrice === null || q.priceEGP < lowestOfferPrice)) {
            lowestOfferPrice = q.priceEGP;
          }
        }
      }
    }

    return { totalOffers, lowestOfferPrice, firstReqWithOffers };
  }, [requests, quotes]);

  const displayedServices = useMemo(() => {
    if (activeCategoryFilter === 'all') {
      const popular = SERVICES_CATALOG.filter((s) => s.isPopular);
      return popular.slice(0, 8);
    }
    return SERVICES_CATALOG.filter((s) => s.categoryId === activeCategoryFilter);
  }, [activeCategoryFilter]);

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
    ).slice(0, 4);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenAllServices(searchQuery.trim());
  };

  return (
    <div className="space-y-5 md:space-y-7 pb-8">
      {/* High-Visibility Customer Offer Alert Banner (Syaanh Flow) */}
      {openOffersAlert.totalOffers > 0 && openOffersAlert.firstReqWithOffers && onOpenRequests && (
        <section className="max-w-7xl mx-auto px-3.5 md:px-6 pt-3">
          <button
            type="button"
            onClick={() => onOpenRequests('open')}
            className="w-full text-right bg-gradient-to-l from-[#FF5A00] to-orange-600 dark:from-orange-600 dark:to-orange-700 text-white rounded-2xl p-3.5 md:p-4 flex items-center justify-between gap-3 hover:brightness-105 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="text-xs md:text-sm font-extrabold truncate tabular-nums">
                  تنبيه: وصلك {openOffersAlert.totalOffers}{' '}
                  {openOffersAlert.totalOffers === 1 ? 'عرض سعر' : 'عروض أسعار'} لطلب «{openOffersAlert.firstReqWithOffers.serviceTitle}»
                </div>
                <div className="text-[11px] text-orange-100 truncate tabular-nums">
                  {openOffersAlert.lowestOfferPrice !== null
                    ? `عروض تبدأ من ${formatEGP(openOffersAlert.lowestOfferPrice)} · اختر العرض ثم تواصل موبايل أو واتساب`
                    : 'اختر العرض الأنسب وتواصل موبايل أو واتساب مباشرة'}
                </div>
              </div>
            </div>

            <span className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white text-[#FF5A00] text-xs font-extrabold inline-flex items-center gap-1 whitespace-nowrap shrink-0">
              <span>اختيار العرض</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </span>
          </button>
        </section>
      )}

      {/* Compact Active Request Tracker */}
      {activeTrackingRequest &&
        (() => {
          const reqQuotes = quotes.filter((q) => q.requestId === activeTrackingRequest.id);
          const acceptedQuote = reqQuotes.find(
            (q) => q.id === activeTrackingRequest.acceptedQuoteId || q.status === 'accepted'
          );
          const fastStatus = getFastQuoteWindowStatus(
            activeTrackingRequest.createdAtTimestamp,
            reqQuotes.length,
            nowMs
          );
          const currentStageIndex = HOME_TRACKING_STEPS.findIndex(
            (s) => s.id === activeTrackingRequest.status
          );
          const liveTrip =
            activeTrackingRequest.status === 'en_route' && acceptedQuote
              ? computeLiveTripMetrics(activeTrackingRequest, acceptedQuote, technicians, nowMs)
              : null;

          return (
            <section className="max-w-7xl mx-auto px-3.5 md:px-6 pt-3">
              <div className="bg-gradient-to-l from-orange-50 via-white to-white dark:from-orange-950/60 dark:via-slate-900 dark:to-slate-900 border border-orange-200 dark:border-orange-800/80 rounded-2xl p-3.5 md:p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#FF5A00] dark:bg-orange-600 text-white flex items-center justify-center shrink-0">
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
                      <div className="text-[11px] font-bold text-orange-700 dark:text-orange-400 truncate tabular-nums">
                        {activeTrackingRequest.status === 'en_route' && liveTrip
                          ? `في الطريق · ${liveTrip.remainingKm} كم (${liveTrip.etaMinutes} د)`
                          : activeTrackingRequest.status === 'in_progress'
                            ? 'جاري التنفيذ'
                            : activeTrackingRequest.status === 'quote_accepted'
                              ? 'تم تأكيد العرض'
                              : `${fastStatus.headline} · ${reqQuotes.length} عروض`}
                        {' · '}#{activeTrackingRequest.referenceCode}
                      </div>
                      <div className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {activeTrackingRequest.serviceTitle}
                      </div>
                    </div>
                  </div>

                  {onOpenRequests && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenRequests(
                          activeTrackingRequest.status === 'open_for_quotes' ? 'open' : 'active'
                        )
                      }
                      className="min-h-[38px] px-3 py-1.5 bg-[#FF5A00] hover:bg-orange-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>متابعة</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-5 gap-1">
                  {HOME_TRACKING_STEPS.map((stage, idx) => {
                    const isDone = idx <= currentStageIndex;
                    return (
                      <div key={stage.id} className="space-y-1">
                        <div
                          className={`h-1 rounded-full ${
                            isDone ? 'bg-[#FF5A00] dark:bg-orange-500' : 'bg-slate-200 dark:bg-slate-800'
                          }`}
                        />
                        <div
                          className={`text-[10px] truncate text-center ${
                            idx === currentStageIndex
                              ? 'font-bold text-orange-700 dark:text-orange-400'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {stage.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })()}

      {/* Compact Mobile-First Hero + Search + Action Tiles */}
      <section className={`max-w-7xl mx-auto px-3.5 md:px-6 ${activeTrackingRequest || openOffersAlert.totalOffers > 0 ? 'pt-0' : 'pt-3 md:pt-5'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-6 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] md:text-xs font-bold text-orange-700 dark:text-orange-400">
                  فنيون معتمدون · عروض خلال 30 دقيقة
                </span>
                <span className="hidden sm:inline text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  اختر منطقتك عند إرسال الطلب
                </span>
              </div>

              <h1 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 leading-snug text-balance">
                اطلب فني في منطقتك بأفضل سعر
              </h1>

              {/* Search + Primary CTA */}
              <div className="relative">
                <form onSubmit={handleSearchSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search
                      className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ابحث عن خدمة..."
                      className="w-full h-11 pr-9 pl-3 text-xs md:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-[#FF5A00] focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onRequestService()}
                    className="h-11 px-4 bg-[#FF5A00] dark:bg-orange-600 text-white text-xs md:text-sm font-bold rounded-xl hover:bg-orange-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    اطلب خدمة
                  </button>
                </form>

                {quickSearchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-[48px] z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                    {quickSearchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onRequestService(item)}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 text-right hover:bg-orange-50/50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {item.title}
                        </span>
                        <span className="text-[11px] font-bold text-[#FF5A00] shrink-0 mr-3">
                          اطلب
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Compact 4-Tile Quick Actions (Includes «عروض وباقات» tile + «خدمة طوارئ») */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsBundlesOpen(true)}
                className="min-h-[54px] px-3 py-2.5 rounded-2xl border border-orange-200 dark:border-orange-800/70 bg-orange-50/80 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/50 text-orange-900 dark:text-orange-200 flex items-center justify-center gap-2 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                <span>عروض وباقات</span>
              </button>

              <EmergencyServicesSection
                district={district}
                locations={locations}
                technicians={technicians}
                user={activeUser}
                requests={requests}
                quotes={quotes}
                reviews={reviews}
                onDispatchEmergency={onDispatchEmergency}
                onAcceptQuote={onAcceptQuote}
                onOpenRequests={onOpenRequests}
                compactTile
              />

              <button
                type="button"
                onClick={onOpenSmartPlanner}
                className="min-h-[54px] px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 hover:border-[#FF5A00] text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                <Bot className="w-4 h-4 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                <span>مخطط الصيانة</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenAllServices('')}
                className="min-h-[54px] px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 hover:border-[#FF5A00] text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                <LayoutGrid className="w-4 h-4 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                <span>كل الخدمات</span>
              </button>
            </div>
          </div>

          {/* Compact Desktop Hero Image Panel */}
          <div className="hidden lg:block lg:col-span-5 relative rounded-2xl overflow-hidden border border-orange-200 dark:border-slate-800 min-h-[220px] bg-gradient-to-br from-[#FF5A00] via-orange-600 to-orange-700">
            <ServiceImage
              src={HERO_IMAGE_PATH}
              alt="فني صيانة معتمد من منصة خدمات"
              iconKey="ac"
              className="w-full h-full object-cover opacity-40 mix-blend-multiply"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-orange-700/30 to-[#FF5A00]/75 flex flex-col justify-between p-6">
              <div className="flex items-center justify-between gap-2">
                <BrandWordmark variant="inverted" size="md" />
                <span className="text-xs font-bold text-orange-100 tabular-nums">
                  +2,400 طلب منجز
                </span>
              </div>
              <p className="text-lg font-bold text-white leading-snug">
                قارن العروض، أرفق صور العطل، وتابع الفني لحظة بلحظة
              </p>
            </div>
          </div>
        </div>

        {/* Compact Syaanh 4-Step Flow Strip */}
        <div className="mt-3 grid grid-cols-4 gap-1.5 md:gap-2.5 text-center">
          {[
            { num: '1', label: 'اطلب الخدمة' },
            { num: '2', label: 'استقبل العروض' },
            { num: '3', label: 'اختر الأنسب' },
            { num: '4', label: 'موبايل أو واتساب' },
          ].map((step) => (
            <button
              key={step.num}
              type="button"
              onClick={() => (step.num === '1' ? onRequestService() : onOpenRequests?.('open'))}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#FF5A00]/60 rounded-xl px-1.5 py-2 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 transition-colors cursor-pointer"
            >
              <span className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-950/70 text-[#FF5A00] dark:text-orange-400 text-[11px] font-extrabold flex items-center justify-center shrink-0 tabular-nums">
                {step.num}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight line-clamp-1">
                {step.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Unified «الخدمات» Section (Merging Main Categories + Top Services with AI Art) */}
      <section className="max-w-7xl mx-auto px-3.5 md:px-6 space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-slate-50">
            الخدمات
          </h2>
          <button
            type="button"
            onClick={() => onOpenAllServices('')}
            className="inline-flex items-center gap-1 text-xs md:text-sm font-semibold text-[#FF5A00] dark:text-orange-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>عرض الكل ({SERVICES_CATALOG.length})</span>
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Horizontal Category Filter Strip with AI Thumbnails */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setActiveCategoryFilter('all')}
            className={`min-h-[42px] px-3.5 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activeCategoryFilter === 'all'
                ? 'bg-[#FF5A00] dark:bg-orange-600 text-white border-[#FF5A00]'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
            }`}
          >
            الأكثر طلباً
          </button>

          {SERVICE_CATEGORIES.map((cat) => {
            const isActive = activeCategoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={`min-h-[42px] pl-3 pr-1.5 py-1 rounded-xl border text-xs font-bold inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#FF5A00] dark:bg-orange-600 text-white border-[#FF5A00]'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-orange-400'
                }`}
              >
                <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                  <ServiceImage
                    src={cat.imageUrl}
                    alt={cat.name}
                    iconKey={cat.iconKey}
                    className="w-full h-full"
                  />
                </div>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Compact 2-Col Mobile / 4-Col Desktop Service Cards with AI Images */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-4">
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
                  <div className="relative aspect-[4/3] w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
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
                        aria-pressed={isFavorite}
                        aria-label={isFavorite ? `إزالة ${service.title} من المفضلة` : `إضافة ${service.title} للمفضلة`}
                        className={`absolute top-2 left-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl border backdrop-blur-sm transition-colors cursor-pointer ${
                          isFavorite
                            ? 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-600'
                            : 'bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>
                    )}
                  </div>

                  <div className="p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                      <span className="inline-flex items-center gap-0.5 text-slate-700 dark:text-slate-200 font-semibold">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {service.rating}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{service.estimatedDuration}</span>
                    </div>

                    <h3 className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {service.title}
                    </h3>
                  </div>
                </div>

                <div className="px-3 pb-3 pt-1 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-orange-700 dark:text-orange-400 tabular-nums truncate">
                    {marketStats.lowestOfferEGP !== null
                      ? `من ${formatEGP(marketStats.lowestOfferEGP)}`
                      : cat?.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRequestService(service)}
                    className="min-h-[36px] px-3 py-1.5 bg-[#FF5A00] dark:bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    اطلب
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Compact Top Technicians Strip */}
      <section className="max-w-7xl mx-auto px-3.5 md:px-6 space-y-3">
        <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-50">
          فنيون مميزون
        </h2>
        <div className="flex md:grid md:grid-cols-3 gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {featuredTechnicians.map(({ technician: tech, effectiveRating, totalReviews }) => (
            <article
              key={tech.id}
              className="min-w-[240px] md:min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#FF5A00] text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {tech.isCompany ? <Building2 className="w-4 h-4" /> : tech.initials}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {tech.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
                    <button
                      type="button"
                      onClick={() => onViewTechnicianStats(tech.id)}
                      className="inline-flex items-center gap-0.5 text-orange-700 dark:text-orange-400 font-bold cursor-pointer"
                    >
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      {effectiveRating.toFixed(1)} ({totalReviews})
                    </button>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{tech.area}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onRequestService(undefined, tech.categoryIds[0])}
                className="min-h-[36px] px-3 py-1.5 bg-orange-50 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 text-xs font-bold rounded-xl shrink-0 cursor-pointer"
              >
                طلب
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* Internal «عروض وباقات» Modal */}
      <BundlesModal
        isOpen={isBundlesOpen}
        onClose={() => setIsBundlesOpen(false)}
        onSelectBundle={(bundle, matchedService) => {
          if (onRequestBundle) {
            onRequestBundle(bundle);
          } else {
            onRequestService(matchedService, bundle.categoryId);
          }
        }}
      />
    </div>
  );
}
