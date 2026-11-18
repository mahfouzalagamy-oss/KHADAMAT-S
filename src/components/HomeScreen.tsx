import {
  ArrowLeft,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Droplets,
  Heart,
  MapPin,
  MonitorSmartphone,
  Navigation,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Timer,
  TrendingDown,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  CUSTOMER_TESTIMONIALS,
  HERO_IMAGE_PATH,
  SEASONAL_BUNDLES,
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
} from '../types/khadamat';
import { BrandWordmark } from './BrandWordmark';
import { CategoryIcon } from './CategoryIcon';
import { DakahliaCoverageMap } from './DakahliaCoverageMap';
import { DigitalWarrantyCard, HomeWarrantyPassportStrip } from './DigitalWarrantyCard';
import { EmergencyServicesSection } from './EmergencyServicesSection';
import { computeLiveTripMetrics } from './LiveTechnicianRouteMap';
import { ServiceImage } from './ServiceImage';

interface HomeScreenProps {
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
  onOpenSmartPlanner: () => void;
  onDispatchEmergency: (req: ServiceRequest) => void;
}

const INSTANT_QUICK_SHORTCUTS = [
  {
    id: 'quick-ac',
    label: 'تكييف سبليت',
    sublabel: 'غسيل وفريون',
    serviceId: 'ac-clean-split',
    categoryId: 'ac',
    icon: Wind,
  },
  {
    id: 'quick-plumbing',
    label: 'سباكة طارئة',
    sublabel: 'تسريب وصرف',
    serviceId: 'plumb-leak',
    categoryId: 'plumbing',
    icon: Droplets,
  },
  {
    id: 'quick-elec',
    label: 'أعطال كهرباء',
    sublabel: 'لوحة وإنارة',
    serviceId: 'elec-panel',
    categoryId: 'electrical',
    icon: Zap,
  },
  {
    id: 'quick-tech',
    label: 'إلكترونيات وواي فاي',
    sublabel: 'لابتوب وMesh',
    serviceId: 'net-mesh-wifi',
    categoryId: 'networks',
    icon: MonitorSmartphone,
  },
] as const;

const HOME_TRACKING_STEPS: {
  id: Exclude<ServiceRequestStatus, 'cancelled'>;
  label: string;
}[] = [
  { id: 'open_for_quotes', label: 'استقبال العروض' },
  { id: 'quote_accepted', label: 'تأكيد العرض' },
  { id: 'en_route', label: 'في الطريق' },
  { id: 'in_progress', label: 'جاري التنفيذ' },
  { id: 'completed', label: 'مكتمل' },
];

export function HomeScreen({
  district,
  locations,
  technicians,
  reviews,
  quotes,
  requests,
  isDark = false,
  favoriteServiceIds = [],
  onToggleFavoriteService,
  onOpenLocation,
  onSelectDistrict,
  onSelectCategory,
  onRequestService,
  onRequestBundle,
  onOpenRequests,
  onRequestWarrantyCheck,
  onViewTechnicianStats,
  onOpenAllServices,
  onOpenSmartPlanner,
  onDispatchEmergency,
}: HomeScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllFeaturedTechs, setShowAllFeaturedTechs] = useState(false);
  const [copiedPromoCode, setCopiedPromoCode] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 5000);
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

  const popularServices = useMemo(
    () => SERVICES_CATALOG.filter((s) => s.isPopular),
    []
  );

  const favoriteServices = useMemo(
    () =>
      favoriteServiceIds
        .map((id) => SERVICES_CATALOG.find((s) => s.id === id))
        .filter((s): s is ServiceItem => Boolean(s)),
    [favoriteServiceIds]
  );

  const featuredTechnicians = useMemo(
    () => computeFeaturedTechnicians(technicians, reviews, quotes, requests),
    [technicians, reviews, quotes, requests]
  );

  const visibleFeaturedTechnicians = useMemo(
    () => (showAllFeaturedTechs ? featuredTechnicians.slice(0, 6) : featuredTechnicians.slice(0, 3)),
    [featuredTechnicians, showAllFeaturedTechs]
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

  const handleCopyPromo = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {}
    setCopiedPromoCode(code);
    window.setTimeout(() => setCopiedPromoCode(null), 2200);
  };

  return (
    <div className="space-y-11 pb-12">
      {/* 24/7 Emergency Services Section («خدمات الطوارئ 24/7») */}
      <EmergencyServicesSection
        district={district}
        user={{ name: 'عميل خدمات', phone: '01012345678', defaultDistrict: district }}
        onDispatchEmergency={onDispatchEmergency}
        onOpenLocation={onOpenLocation}
      />

      {/* Top Active Order Live Tracking Card (when customer has an active order) */}
      {activeTrackingRequest && (() => {
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
            ? computeLiveTripMetrics(
                activeTrackingRequest,
                acceptedQuote,
                technicians,
                nowMs
              )
            : null;

        return (
          <section className="max-w-7xl mx-auto px-4 md:px-6 pt-4 md:pt-5">
            <div className="bg-gradient-to-l from-orange-50 via-white to-white dark:from-orange-950/60 dark:via-slate-900 dark:to-slate-900 border border-orange-200 dark:border-orange-800/80 rounded-2xl p-4 md:p-5 shadow-sm space-y-3.5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#FF5A00] dark:bg-orange-600 text-white flex items-center justify-center shrink-0">
                    {activeTrackingRequest.status === 'en_route' ? (
                      <Navigation className="w-5 h-5" />
                    ) : activeTrackingRequest.status === 'in_progress' ? (
                      <Wrench className="w-5 h-5" />
                    ) : activeTrackingRequest.status === 'quote_accepted' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Timer className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-orange-700 dark:text-orange-400 tabular-nums">
                      <span>
                        {activeTrackingRequest.status === 'en_route' && liveTrip
                          ? `الفني في الطريق إليك · متبقي ${liveTrip.remainingKm} كم (الوصول خلال ${liveTrip.etaMinutes} د)`
                          : activeTrackingRequest.status === 'in_progress'
                          ? 'جاري تنفيذ الخدمة في منزلك'
                          : activeTrackingRequest.status === 'quote_accepted'
                          ? 'تم تأكيد العرض وموعد الزيارة'
                          : `${fastStatus.headline} · ${reqQuotes.length} عروض وصلت`}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>#{activeTrackingRequest.referenceCode}</span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                      {activeTrackingRequest.serviceTitle}
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                      {acceptedQuote
                        ? liveTrip
                          ? `${acceptedQuote.technicianName} · الوصول ~ ${liveTrip.arrivalTimeLabel}`
                          : `${acceptedQuote.technicianName} · ${acceptedQuote.estimatedArrival}`
                        : `${activeTrackingRequest.district} · بانتظار اختيارك لأفضل عرض`}
                    </p>
                  </div>
                </div>

                {onOpenRequests && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenRequests(
                        activeTrackingRequest.status === 'open_for_quotes'
                          ? 'open'
                          : 'active'
                      )
                    }
                    className="min-h-[44px] px-4 py-2.5 bg-[#FF5A00] hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 text-white text-xs font-bold rounded-xl inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>
                      {activeTrackingRequest.status === 'en_route'
                        ? 'عرض خريطة المسار اللحظي'
                        : 'متابعة الطلب والعروض'}
                    </span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* 5-Stage Horizontal Live Progress Strip */}
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {HOME_TRACKING_STEPS.map((stage, idx) => {
                  const isDone = idx <= currentStageIndex;
                  const isCurrent = idx === currentStageIndex;
                  return (
                    <div key={stage.id} className="space-y-1">
                      <div
                        className={`h-1.5 rounded-full transition-colors ${
                          isDone
                            ? 'bg-[#FF5A00] dark:bg-orange-500'
                            : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      />
                      <div
                        className={`text-[10px] truncate text-center ${
                          isCurrent
                            ? 'font-bold text-orange-700 dark:text-orange-400'
                            : isDone
                            ? 'font-semibold text-slate-700 dark:text-slate-300'
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

      {/* Upgraded Hero Section with Talabat Warm Orange Identity & Quick-Request Bar */}
      <section
        className={`max-w-7xl mx-auto px-4 md:px-6 ${
          activeTrackingRequest ? 'pt-0' : 'pt-5 md:pt-8'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Start Column: Headline + District + Search + Instant 1-Tap Shortcuts */}
          <div className="lg:col-span-6 flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 transition-colors">
            <div className="space-y-5">
              <div className="hidden md:flex items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onOpenLocation}
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-[#FF5A00] dark:hover:text-orange-400 transition-colors cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-[#FF5A00] dark:text-orange-400 shrink-0" aria-hidden="true" />
                  <span className="truncate max-w-[290px]">{district}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                </button>
                <span className="text-xs font-semibold text-orange-700 dark:text-orange-400 shrink-0 inline-flex items-center gap-1">
                  <Timer className="w-3.5 h-3.5 shrink-0" />
                  <span>عروض خلال 30 دقيقة</span>
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50 leading-tight text-balance">
                اطلب خدمتك الآن واستقبل عروض الفنيين بأفضل سعر
              </h1>

              <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                صيانة المنازل والإلكترونيات والشبكات في المنصورة، المنصورة الجديدة، وكل مدن وقرى الدقهلية مع تتبع لحظي للفني.
              </p>

              {/* Search Bar + Primary CTA */}
              <div className="relative pt-1">
                <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search
                      className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ابحث عن خدمة: تكييف، سباكة، لابتوب، واي فاي..."
                      className="w-full h-12 pr-10 pl-4 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onRequestService()}
                    className="h-12 px-5 bg-[#FF5A00] dark:bg-orange-600 text-white text-sm font-bold rounded-xl hover:bg-orange-700 dark:hover:bg-orange-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm shadow-orange-600/20"
                  >
                    اطلب خدمة الآن
                  </button>
                </form>

                {/* Live Quick Results Dropdown */}
                {quickSearchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-[56px] z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                    {quickSearchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onRequestService(item)}
                        className="w-full flex items-center justify-between px-4 py-3 text-right hover:bg-orange-50/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {item.title}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.summary}
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#FF5A00] dark:text-orange-400 shrink-0 mr-4">
                          اطلب عروضاً
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Instant 1-Tap Quick-Request Shortcut Buttons */}
            <div className="pt-5 mt-5 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  طلب فوري بضغطة واحدة:
                </span>
                <button
                  type="button"
                  onClick={() => onOpenAllServices('')}
                  className="font-semibold text-[#FF5A00] dark:text-orange-400 hover:underline cursor-pointer"
                >
                  كل الأقسام (15)
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {INSTANT_QUICK_SHORTCUTS.map((shortcut) => {
                  const Icon = shortcut.icon;
                  const targetService = SERVICES_CATALOG.find(
                    (s) => s.id === shortcut.serviceId
                  );
                  return (
                    <button
                      key={shortcut.id}
                      type="button"
                      onClick={() =>
                        onRequestService(targetService, shortcut.categoryId)
                      }
                      className="min-h-[54px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/70 hover:border-[#FF5A00] dark:hover:border-orange-500 hover:bg-orange-50/70 dark:hover:bg-orange-950/50 text-right flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <span className="w-8 h-8 rounded-lg bg-orange-100/80 dark:bg-orange-950 text-[#FF5A00] dark:text-orange-400 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate">
                          {shortcut.label}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                          {shortcut.sublabel}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* End Column: Talabat-Inspired Warm Orange Showcase Panel with Signature «خدمات» Wordmark */}
          <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-orange-200 dark:border-slate-800 min-h-[280px] lg:min-h-[410px] bg-gradient-to-br from-[#FF5A00] via-orange-600 to-orange-700">
            <ServiceImage
              src={HERO_IMAGE_PATH}
              alt="فني صيانة معتمد من منصة خدمات في منزل حديث"
              iconKey="ac"
              className="w-full h-full object-cover opacity-35 mix-blend-multiply"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-orange-700/35 to-[#FF5A00]/80 flex flex-col justify-between p-6 md:p-8">
              <div className="flex items-start justify-between gap-3">
                <BrandWordmark variant="inverted" size="lg" showTagline />
                <span className="text-xs font-bold text-orange-100 tabular-nums shrink-0 pt-1">
                  +2,400 مهمة مكتملة
                </span>
              </div>

              <div className="text-white space-y-2">
                <p className="text-xs font-bold text-orange-200">
                  تغطية الدقهلية والمنصورة الجديدة · عروض تنافسية خلال 30 دقيقة
                </p>
                <p className="text-xl md:text-2xl font-bold leading-snug">
                  قارن العروض، أرفق صور العطل، وتابع وصول الفني لحظة بلحظة
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Workflow & Competitive Advantages Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">1. اطلب وأرفق صور العطل</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              حدد المشكلة وأضف صوراً لتسعير أدق
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">2. عروض خلال 30 دقيقة</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              قارن أسعار الفنيين ومؤشر التوفير
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">3. تتبع الفني في الطريق</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              متابعة فورية من القبول حتى الإنجاز
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">4. خصومات وباقات موسمية</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              أكواد توفير وباقات صيانة متكاملة
            </div>
          </div>
        </div>
      </section>

      {/* Smart Planning Assistant Banner (Gemini AI) */}
      <section className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="bg-gradient-to-l from-orange-500 via-[#FF5A00] to-amber-600 text-white rounded-2xl p-6 md:p-7 shadow-md flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/20 px-2.5 py-0.5 rounded-full text-white">
                <Sparkles className="w-3.5 h-3.5" />
                <span>مساعد التخطيط الذكي بالذكاء الاصطناعي (Gemini 3.1 Flash Lite)</span>
              </div>
              <h3 className="text-lg md:text-xl font-black text-white">
                صمم جدول صيانة ذكي ومخصص لمنزلك بالدقهلية
              </h3>
              <p className="text-xs text-orange-100 max-w-lg leading-relaxed">
                أدخل تفاصيل عقارك وعدد التكييفات لنقوم بتوليد خطة صيانة وقائية دقيقة تتوقع الأعطال وتوفر عليك مصاريف الإصلاح.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenSmartPlanner}
            className="min-h-[44px] px-5 py-2.5 bg-white text-[#FF5A00] hover:bg-orange-50 text-xs font-extrabold rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-95"
          >
            فتح مساعد التخطيط الذكي
          </button>
        </div>
      </section>

      {/* Seasonal Maintenance Bundles & Promo Offers («باقات وعروض التوفير الموسمية») */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FF5A00] dark:text-orange-400 shrink-0" />
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50">
                باقات وعروض التوفير الموسمية
              </h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              باقات صيانة مجمعة بأكواد خصم فورية توفر عليك حتى 15% من قيمة العرض المقبول
            </p>
          </div>

          <span className="text-xs font-bold text-orange-700 dark:text-orange-400 shrink-0">
            استخدم كود KHADAMAT15 أو DAKAHLIA10 في أي طلب
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SEASONAL_BUNDLES.map((bundle) => {
            const targetService = SERVICES_CATALOG.find(
              (s) => s.id === bundle.serviceId
            );
            const isCopied = copiedPromoCode === bundle.promoCode;

            return (
              <article
                key={bundle.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-[#FF5A00]/60 dark:hover:border-orange-500/60 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-[#FF5A00] dark:text-orange-400">
                      {bundle.seasonLabel}
                    </span>
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {bundle.estimatedSavingsLabel}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {bundle.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {bundle.subtitle}
                    </p>
                  </div>

                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    {bundle.includedTasks.map((task) => (
                      <li key={task} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400 shrink-0 mt-0.5" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 bg-orange-50/70 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-800/70 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Tag className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                      <span className="text-slate-600 dark:text-slate-300">كود الخصم:</span>
                      <strong dir="ltr" className="font-mono font-extrabold text-orange-800 dark:text-orange-300">
                        {bundle.promoCode}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyPromo(bundle.promoCode)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-700 dark:text-orange-300 hover:underline cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onRequestBundle) {
                        onRequestBundle(bundle);
                      } else {
                        onRequestService(targetService, bundle.categoryId);
                      }
                    }}
                    className="w-full min-h-[44px] px-4 py-2.5 bg-[#FF5A00] hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    احجز الباقة بخصم {bundle.discountPercent}%
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Active Digital Warranty Passport Strip («جواز الضمان الرقمي») */}
      {onRequestWarrantyCheck && (
        <HomeWarrantyPassportStrip
          completedRequests={requests.filter((r) => r.status === 'completed')}
          quotes={quotes}
          onOpenWarrantyHistory={() =>
            onOpenRequests ? onOpenRequests('history') : undefined
          }
          onRequestWarrantyCheck={onRequestWarrantyCheck}
        />
      )}

      {/* My Favorite Services («خدماتي المفضلة») */}
      <section
        id="favorite-services"
        className="max-w-7xl mx-auto px-4 md:px-6 space-y-5"
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Heart
                className="w-5 h-5 fill-rose-500 text-rose-500 dark:fill-rose-400 dark:text-rose-400 shrink-0"
                aria-hidden="true"
              />
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50">
                خدماتي المفضلة
              </h2>
              {favoriteServices.length > 0 && (
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400 tabular-nums">
                  ({favoriteServices.length})
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              وصول سريع للخدمات التي قمت بحفظها لطلبها بضغطة واحدة
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenAllServices('')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#FF5A00] dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>تصفح الخدمات</span>
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {favoriteServices.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  لا توجد خدمات مفضلة حالياً
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  اضغط على أيقونة القلب في أي بطاقة خدمة بالأسفل أو في «كل الخدمات» لإضافتها هنا للوصول السريع.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenAllServices('')}
              className="min-h-[44px] px-4 py-2 text-xs font-semibold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/70 hover:bg-orange-100 dark:hover:bg-orange-900/70 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              استعراض كل الخدمات
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteServices.map((service) => {
              const cat = SERVICE_CATEGORIES.find((c) => c.id === service.categoryId);
              const marketStats = computeServiceMarketStats(
                service.title,
                quotes,
                requests,
                reviews
              );
              return (
                <article
                  key={`fav-${service.id}`}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-[#FF5A00]/50 dark:hover:border-orange-500/50 transition-colors"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-[#FF5A00] dark:text-orange-400 flex items-center justify-center shrink-0">
                          <CategoryIcon
                            iconKey={cat?.iconKey || 'carpentry'}
                            className="w-5 h-5"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="truncate">{cat?.name}</span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-0.5 text-slate-700 dark:text-slate-200 font-semibold tabular-nums shrink-0">
                              <Star
                                className="w-3 h-3 fill-amber-500 text-amber-500"
                                aria-hidden="true"
                              />
                              {service.rating}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                            {service.title}
                          </h3>
                        </div>
                      </div>

                      {onToggleFavoriteService && (
                        <button
                          type="button"
                          onClick={() => onToggleFavoriteService(service.id)}
                          aria-pressed={true}
                          aria-label={`إزالة ${service.title} من خدماتي المفضلة`}
                          title="إزالة من المفضلة"
                          className="min-w-[44px] min-h-[44px] -mt-1 -ml-1 flex items-center justify-center rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors shrink-0 cursor-pointer active:scale-95"
                        >
                          <Heart className="w-5 h-5 fill-rose-500 text-rose-500 dark:fill-rose-400 dark:text-rose-400" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {service.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="text-xs min-w-0">
                      {marketStats.lowestOfferEGP !== null ? (
                        <div className="space-y-0.5">
                          <span className="font-bold text-orange-700 dark:text-orange-400 tabular-nums block">
                            يبدأ من {formatEGP(marketStats.lowestOfferEGP)}
                          </span>
                          {marketStats.savingsPercent >= 3 && (
                            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">
                              توفير {marketStats.savingsPercent}% عن المتوسط
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400">
                          {service.estimatedDuration}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onRequestService(service)}
                      className="px-4 py-2 min-h-[44px] bg-[#FF5A00] dark:bg-orange-600 text-white text-xs font-semibold rounded-xl hover:bg-orange-700 dark:hover:bg-orange-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      طلب سريع
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Categories Grid (15 Categories including Electronics & Home Networks) */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50">
              الأقسام الرئيسية (15 تخصصاً)
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              شاملة صيانة المنزل، الإلكترونيات والكمبيوتر، والشبكات والواي فاي
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenAllServices('')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#FF5A00] dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>كل الأقسام</span>
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {SERVICE_CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelectCategory(category.id)}
              className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-right hover:border-[#FF5A00]/70 dark:hover:border-orange-500/70 transition-colors flex flex-col justify-between min-h-[126px] cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-[#FF5A00] dark:text-orange-400 flex items-center justify-center group-hover:bg-[#FF5A00] dark:group-hover:bg-orange-600 group-hover:text-white transition-colors shrink-0">
                  <CategoryIcon iconKey={category.iconKey} className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-orange-700 dark:text-orange-400 tabular-nums">
                  {category.servicesCount} خدمات
                </span>
              </div>

              <div className="mt-3.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#FF5A00] dark:group-hover:text-orange-400 transition-colors leading-snug">
                  {category.name}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                  {category.shortDesc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Popular Services */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50">
              الخدمات الأكثر طلباً
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              عروض مباشرة من فنيين وشركات منطقتك مع مؤشر توفير التكلفة
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenAllServices('')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#FF5A00] dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>عرض الكل</span>
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {popularServices.map((service) => {
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
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-[#FF5A00]/60 dark:hover:border-orange-500/60 transition-colors"
              >
                <div>
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
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
                        aria-label={
                          isFavorite
                            ? `إزالة ${service.title} من خدماتي المفضلة`
                            : `إضافة ${service.title} إلى خدماتي المفضلة`
                        }
                        title={
                          isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى خدماتي المفضلة'
                        }
                        className={`absolute top-3 left-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border backdrop-blur-sm transition-all cursor-pointer active:scale-95 ${
                          isFavorite
                            ? 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 shadow-sm'
                            : 'bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400'
                        }`}
                      >
                        <Heart
                          className={`w-5 h-5 transition-colors ${
                            isFavorite
                              ? 'fill-rose-500 text-rose-500 dark:fill-rose-400 dark:text-rose-400'
                              : ''
                          }`}
                        />
                      </button>
                    )}
                  </div>
                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{cat?.name}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-200 font-medium tabular-nums">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" aria-hidden="true" />
                        {service.rating}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{service.estimatedDuration}</span>
                    </div>

                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                      {service.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {service.summary}
                    </p>

                    {marketStats.lowestOfferEGP !== null &&
                      marketStats.savingsPercent >= 3 &&
                      marketStats.marketAverageEGP !== null && (
                        <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/70 px-3 py-2 text-xs">
                          <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                            <TrendingDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>أقل من متوسط السوق بـ {marketStats.savingsPercent}%</span>
                          </span>
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 tabular-nums shrink-0">
                            المتوسط {formatEGP(marketStats.marketAverageEGP)}
                          </span>
                        </div>
                      )}
                  </div>
                </div>

                <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  {marketStats.lowestOfferEGP !== null ? (
                    <div className="text-xs">
                      <span className="text-slate-500 dark:text-slate-400 block">أقل عرض متاح:</span>
                      <span className="font-bold text-orange-700 dark:text-orange-400 tabular-nums">
                        {formatEGP(marketStats.lowestOfferEGP)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      السعر حسب عرض الفني
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onRequestService(service)}
                    className="px-4 py-2.5 min-h-[44px] bg-[#FF5A00] dark:bg-orange-600 text-white text-xs font-semibold rounded-xl hover:bg-orange-700 dark:hover:bg-orange-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    اطلب عروضاً
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Interactive Dakahlia Coverage Map */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50">
              خريطة التغطية في الدقهلية والمنصورة الجديدة
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              اضغط على أي مركز لاختيار منطقتك أو مشروعك السكني
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenLocation}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-100 dark:hover:bg-orange-900/60 border border-orange-200/80 dark:border-orange-800/60 px-4 py-2 min-h-[40px] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>إضافة منطقة جديدة</span>
          </button>
        </div>

        <DakahliaCoverageMap
          locations={locations}
          technicians={technicians}
          selectedDistrict={district}
          isDark={isDark}
          onSelectDistrict={onSelectDistrict}
        />
      </section>

      {/* Featured Technicians («الفنيين المميزين») */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50">
              الفنيين المميزين
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              الأعلى تقييماً والأكثر إنجازاً للوظائف المكتملة في الدقهلية والمنصورة الجديدة
            </p>
          </div>

          {featuredTechnicians.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAllFeaturedTechs((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-100 dark:hover:bg-orange-900/60 border border-orange-200/80 dark:border-orange-800/60 px-4 py-2 min-h-[40px] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>
                {showAllFeaturedTechs
                  ? 'عرض أول 3 مميزين'
                  : `عرض المزيد (${Math.min(featuredTechnicians.length, 6)})`}
              </span>
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleFeaturedTechnicians.map((entry) => {
            const {
              technician: tech,
              effectiveRating,
              effectiveCompletedJobs,
              totalReviews,
            } = entry;

            return (
              <article
                key={tech.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-[#FF5A00]/60 dark:hover:border-orange-500/60 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-[#FF5A00] dark:bg-orange-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {tech.isCompany ? <Building2 className="w-5 h-5" /> : tech.initials}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {tech.name}
                      </h3>
                      <span
                        title="درع ثقة · موثق وعالي التقييم"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/70 border border-orange-200/80 dark:border-orange-800/70 rounded-md px-1.5 py-0.5 shrink-0"
                      >
                        <ShieldCheck
                          className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400 shrink-0"
                          aria-hidden="true"
                        />
                        <span>درع ثقة</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                      {tech.specialty}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600 dark:text-slate-400 pt-1 tabular-nums">
                      <button
                        type="button"
                        onClick={() => onViewTechnicianStats(tech.id)}
                        className="inline-flex items-center gap-1 font-semibold text-orange-700 dark:text-orange-400 hover:underline cursor-pointer"
                      >
                        <Star
                          className="w-3.5 h-3.5 fill-amber-500 text-amber-500"
                          aria-hidden="true"
                        />
                        <span>
                          {effectiveRating.toFixed(1)} ({totalReviews} تقييم)
                        </span>
                      </button>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                        ·
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
                        <CheckCircle2
                          className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0"
                          aria-hidden="true"
                        />
                        <span>{effectiveCompletedJobs} وظيفة مكتملة</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {tech.area}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRequestService(undefined, tech.categoryIds[0])}
                    className="px-4 py-2 min-h-[44px] text-xs font-semibold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/70 hover:bg-orange-100 dark:hover:bg-orange-900/70 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    إرسال طلب للتخصص
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                آراء عملائنا
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                تقييمات حقيقية بعد انتهاء الخدمات
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CUSTOMER_TESTIMONIALS.map((item) => (
              <blockquote key={item.id} className="space-y-3">
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  «{item.quote}»
                </p>
                <footer className="text-xs text-slate-500 dark:text-slate-400">
                  <strong className="font-semibold text-slate-900 dark:text-slate-100">
                    {item.author}
                  </strong>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span>{item.area}</span>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span>{item.service}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
