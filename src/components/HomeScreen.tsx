import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  MapPin,
  Navigation,
  Search,
  Sparkles,
  Star,
  Timer,
  Wrench,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  SERVICE_CATEGORIES,
  SERVICES_CATALOG,
  getFastQuoteWindowStatus,
} from '../data/khadamatData';
import {
  ServiceItem,
  ServiceQuote,
  ServiceRequest,
  ServiceRequestStatus,
  Technician,
} from '../types/khadamat';
import { CategoryIcon } from './CategoryIcon';
import { computeLiveTripMetrics } from './LiveTechnicianRouteMap';
import { ServiceImage } from './ServiceImage';

interface HomeScreenProps {
  district: string;
  technicians: Technician[];
  quotes: ServiceQuote[];
  requests: ServiceRequest[];
  onOpenLocation: () => void;
  onSelectCategory: (categoryId: string) => void;
  onRequestService: (service?: ServiceItem, categoryId?: string) => void;
  onOpenRequests: (targetTab?: 'open' | 'active' | 'history', requestId?: string) => void;
  onOpenAllServices: (initialQuery?: string) => void;
  onOpenSmartPlanner: () => void;
}

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
  technicians,
  quotes,
  requests,
  onOpenLocation,
  onSelectCategory,
  onRequestService,
  onOpenRequests,
  onOpenAllServices,
  onOpenSmartPlanner,
}: HomeScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
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
    () => SERVICES_CATALOG.filter((s) => s.isPopular).slice(0, 4),
    []
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
    <div className="space-y-6 pb-10">
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

                {(
                  <button
                    type="button"
                    onClick={() =>
                      onOpenRequests(
                        activeTrackingRequest.status === 'open_for_quotes'
                          ? 'open'
                          : 'active',
                        activeTrackingRequest.id
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

      {/* Compact request bar: location + search + CTA */}
      <section
        className={`max-w-3xl mx-auto px-4 md:px-6 space-y-3 ${
          activeTrackingRequest ? 'pt-0' : 'pt-5 md:pt-8'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50">
            ماذا تحتاج اليوم؟
          </h1>
          <button
            type="button"
            onClick={onOpenLocation}
            className="inline-flex items-center gap-1.5 text-xs md:text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-[#FF5A00] dark:hover:text-orange-400 transition-colors cursor-pointer min-w-0"
          >
            <MapPin className="w-4 h-4 text-[#FF5A00] dark:text-orange-400 shrink-0" aria-hidden="true" />
            <span className="truncate max-w-[160px] md:max-w-[260px]">{district}</span>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          </button>
        </div>

        <div className="relative">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن خدمة: تكييف، سباكة، واي فاي..."
                className="w-full h-12 pr-10 pl-4 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={() => onRequestService()}
              className="h-12 px-4 md:px-5 bg-[#FF5A00] dark:bg-orange-600 text-white text-sm font-bold rounded-xl hover:bg-orange-700 dark:hover:bg-orange-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              اطلب خدمة
            </button>
          </form>

          {quickSearchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-[52px] z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
              {quickSearchResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onRequestService(item)}
                  className="w-full flex items-center justify-between px-4 py-3 text-right hover:bg-orange-50/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </span>
                  <span className="text-xs font-bold text-[#FF5A00] dark:text-orange-400 shrink-0 mr-4">
                    اطلب عروضاً
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories: compact icon grid */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-50">
            الأقسام
          </h2>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onOpenSmartPlanner}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#FF5A00] dark:hover:text-orange-400 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>خطة صيانة ذكية</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenAllServices('')}
              className="inline-flex items-center gap-1 text-xs md:text-sm font-semibold text-[#FF5A00] dark:text-orange-400 hover:underline cursor-pointer"
            >
              <span>الكل</span>
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-8 gap-2.5">
          {SERVICE_CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelectCategory(category.id)}
              className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-1.5 py-3 flex flex-col items-center gap-2 hover:border-[#FF5A00]/70 dark:hover:border-orange-500/70 transition-colors cursor-pointer"
            >
              <span className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-[#FF5A00] dark:text-orange-400 flex items-center justify-center group-hover:bg-[#FF5A00] dark:group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <CategoryIcon iconKey={category.iconKey} className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 text-center leading-tight line-clamp-2">
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Popular services: 4 compact rows */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 space-y-3">
        <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-50">
          الأكثر طلباً
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {popularServices.map((service) => {
            const cat = SERVICE_CATEGORIES.find((c) => c.id === service.categoryId);
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => onRequestService(service)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center gap-3 text-right hover:border-[#FF5A00]/60 dark:hover:border-orange-500/60 transition-colors cursor-pointer"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                  <ServiceImage
                    src={service.imageUrl}
                    alt={service.title}
                    iconKey={cat?.iconKey || 'carpentry'}
                    className="w-full h-full"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {service.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="truncate">{cat?.name}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-0.5 tabular-nums text-slate-700 dark:text-slate-200 font-medium">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" aria-hidden="true" />
                      {service.rating}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#FF5A00] dark:text-orange-400 shrink-0">
                  اطلب عروضاً
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
