import {
  Banknote,
  ChevronDown,
  Heart,
  MapPin,
  Navigation,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingDown,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { findNearestMatchingTechnicians } from '../data/dakahliaLocations';
import {
  SERVICE_CATEGORIES,
  SERVICES_CATALOG,
  ServiceMarketStats,
  computeServiceMarketStats,
  formatEGP,
} from '../data/khadamatData';
import {
  LocationEntry,
  ServiceItem,
  ServiceQuote,
  ServiceRequest,
  Technician,
  TechnicianReview,
} from '../types/khadamat';
import { CategoryIcon } from './CategoryIcon';
import { ServiceImage } from './ServiceImage';

interface CategoriesScreenProps {
  selectedCategoryId: string;
  onSelectCategoryId: (id: string) => void;
  initialSearchQuery?: string;
  district: string;
  locations: LocationEntry[];
  technicians: Technician[];
  quotes: ServiceQuote[];
  requests: ServiceRequest[];
  reviews: TechnicianReview[];
  favoriteServiceIds?: string[];
  onToggleFavoriteService?: (serviceId: string) => void;
  onOpenLocation: () => void;
  onRequestService: (service: ServiceItem) => void;
}

type SortOption = 'popular' | 'nearest' | 'rating' | 'lowest_price';

interface EnrichedServiceItem {
  service: ServiceItem;
  availableCount: number;
  minDistanceKm: number;
  matchType: 'exact_area' | 'exact_center' | 'nearest_center';
  nearestCenterName: string;
  isDirectLocal: boolean;
  lowestAvailablePriceEGP: number | null;
  marketStats: ServiceMarketStats;
}

export function CategoriesScreen({
  selectedCategoryId,
  onSelectCategoryId,
  initialSearchQuery = '',
  district,
  locations,
  technicians,
  quotes,
  requests,
  reviews,
  favoriteServiceIds = [],
  onToggleFavoriteService,
  onOpenLocation,
  onRequestService,
}: CategoriesScreenProps) {
  const [query, setQuery] = useState(initialSearchQuery);
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [onlyInMyArea, setOnlyInMyArea] = useState<boolean>(false);
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);

  // Compute proximity routing once per category for current selected Dakahlia location
  const categoryProximityMap = useMemo(() => {
    const map = new Map<
      string,
      {
        availableCount: number;
        minDistanceKm: number;
        matchType: 'exact_area' | 'exact_center' | 'nearest_center';
        nearestCenterName: string;
        isDirectLocal: boolean;
      }
    >();

    for (const cat of SERVICE_CATEGORIES) {
      const routing = findNearestMatchingTechnicians(
        cat.id,
        district,
        technicians,
        locations
      );
      map.set(cat.id, {
        availableCount: routing.targets.length,
        minDistanceKm: routing.minDistanceKm,
        matchType: routing.matchType,
        nearestCenterName: routing.nearestCenterName,
        isDirectLocal:
          routing.matchType === 'exact_area' || routing.matchType === 'exact_center',
      });
    }

    return map;
  }, [district, technicians, locations]);

  // Derive lowest recorded quote/review price and market cost-saving indicator per service
  const enrichedServices = useMemo<EnrichedServiceItem[]>(() => {
    return SERVICES_CATALOG.map((service) => {
      const prox = categoryProximityMap.get(service.categoryId) || {
        availableCount: 0,
        minDistanceKm: 0,
        matchType: 'nearest_center' as const,
        nearestCenterName: 'المنصورة',
        isDirectLocal: false,
      };

      const marketStats = computeServiceMarketStats(
        service.title,
        quotes,
        requests,
        reviews
      );

      return {
        service,
        ...prox,
        lowestAvailablePriceEGP: marketStats.lowestOfferEGP,
        marketStats,
      };
    });
  }, [categoryProximityMap, quotes, requests, reviews]);

  const filteredServices = useMemo(() => {
    let list = [...enrichedServices];

    if (selectedCategoryId !== 'all') {
      list = list.filter((item) => item.service.categoryId === selectedCategoryId);
    }

    const q = query.trim();
    if (q) {
      list = list.filter(
        ({ service }) =>
          service.title.includes(q) ||
          service.summary.includes(q) ||
          service.description.includes(q)
      );
    }

    if (onlyInMyArea) {
      list = list.filter((item) => item.isDirectLocal);
    }

    if (onlyFavorites) {
      list = list.filter((item) => favoriteServiceIds.includes(item.service.id));
    }

    if (sortBy === 'nearest') {
      list.sort((a, b) => {
        if (a.minDistanceKm !== b.minDistanceKm) {
          return a.minDistanceKm - b.minDistanceKm;
        }
        return b.availableCount - a.availableCount;
      });
    } else if (sortBy === 'rating') {
      list.sort((a, b) => {
        if (b.service.rating !== a.service.rating) {
          return b.service.rating - a.service.rating;
        }
        return b.service.reviewsCount - a.service.reviewsCount;
      });
    } else if (sortBy === 'lowest_price') {
      list.sort((a, b) => {
        const aPrice = a.lowestAvailablePriceEGP;
        const bPrice = b.lowestAvailablePriceEGP;
        if (aPrice !== null && bPrice !== null) {
          if (aPrice !== bPrice) return aPrice - bPrice;
          return b.service.rating - a.service.rating;
        }
        if (aPrice !== null) return -1;
        if (bPrice !== null) return 1;
        return b.service.reviewsCount - a.service.reviewsCount;
      });
    } else {
      list.sort((a, b) => b.service.reviewsCount - a.service.reviewsCount);
    }

    return list;
  }, [
    enrichedServices,
    selectedCategoryId,
    query,
    onlyInMyArea,
    onlyFavorites,
    favoriteServiceIds,
    sortBy,
  ]);

  const sortButtons: { id: SortOption; label: string; icon: typeof Star }[] = [
    { id: 'popular', label: 'الأكثر طلباً', icon: Sparkles },
    { id: 'nearest', label: 'الأقرب لنطاقي', icon: Navigation },
    { id: 'rating', label: 'الأعلى تقييماً', icon: Star },
    { id: 'lowest_price', label: 'الأقل سعراً', icon: Banknote },
  ];

  const formatProximitySummary = (item: EnrichedServiceItem) => {
    const techWord = item.availableCount === 1 ? 'فني متاح' : 'فنيين متاحين';
    if (item.matchType === 'exact_area') {
      return `${item.availableCount} ${techWord} · في منطقتك (0 كم)`;
    }
    if (item.matchType === 'exact_center') {
      return `${item.availableCount} ${techWord} · مركز ${item.nearestCenterName} (~${item.minDistanceKm} كم)`;
    }
    return `${item.availableCount} ${techWord} · الأقرب ${item.nearestCenterName} (~${item.minDistanceKm} كم)`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-5 pb-12">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50">
            كل الخدمات
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            رتّب الخدمات حسب الأقرب لنطاقك أو الأعلى تقييماً أو أقل العروض المتاحة
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search
            className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث داخل الخدمات..."
            className="w-full h-11 pr-10 pl-4 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Category Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => onSelectCategoryId('all')}
          className={`min-h-[44px] px-4 py-2 text-xs font-semibold rounded-xl border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            selectedCategoryId === 'all'
              ? 'bg-[#FF5A00] dark:bg-orange-600 text-white border-[#FF5A00] dark:border-orange-600'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          جميع الأقسام ({SERVICES_CATALOG.length})
        </button>

        {SERVICE_CATEGORIES.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategoryId(cat.id)}
              className={`min-h-[44px] px-4 py-2 text-xs font-semibold rounded-xl border inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[#FF5A00] dark:bg-orange-600 text-white border-[#FF5A00] dark:border-orange-600'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <CategoryIcon iconKey={cat.iconKey} className="w-4 h-4 shrink-0" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Advanced Sorting & Geographic Filtering Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 md:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onOpenLocation}
            className="inline-flex items-center justify-between sm:justify-start gap-2 min-h-[40px] px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400 shrink-0" />
              <span className="truncate font-semibold">{district}</span>
            </span>
            <span className="inline-flex items-center gap-0.5 text-orange-700 dark:text-orange-400 font-bold shrink-0">
              <span>تغيير</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </span>
          </button>

          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums px-1">
            {filteredServices.length} خدمة متاحة
          </span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* Direct Sort Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {sortButtons.map((opt) => {
              const Icon = opt.icon;
              const isActive = sortBy === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setSortBy(opt.id)}
                  className={`min-h-[44px] px-3.5 py-2 text-xs font-semibold rounded-xl border inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#FF5A00] dark:bg-orange-600 text-white border-[#FF5A00] dark:border-orange-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-orange-500/50 dark:hover:border-orange-500/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Local Scope & Favorites Toggles */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              aria-pressed={onlyFavorites}
              onClick={() => setOnlyFavorites((prev) => !prev)}
              className={`min-h-[44px] px-4 py-2 text-xs font-semibold rounded-xl border inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                onlyFavorites
                  ? 'bg-rose-600 dark:bg-rose-600 text-white border-rose-600'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500'
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 shrink-0 ${
                  onlyFavorites ? 'fill-white text-white' : 'text-rose-500 dark:text-rose-400'
                }`}
              />
              <span className="tabular-nums">
                المفضلة ({favoriteServiceIds.length})
              </span>
            </button>

            <button
              type="button"
              aria-pressed={onlyInMyArea}
              onClick={() => setOnlyInMyArea((prev) => !prev)}
              className={`min-h-[44px] px-4 py-2 text-xs font-semibold rounded-xl border inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                onlyInMyArea
                  ? 'bg-slate-900 dark:bg-orange-600 text-white border-slate-900 dark:border-orange-600'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#FF5A00] dark:hover:border-orange-500'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>المتاح في منطقتي فقط</span>
            </button>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
            لا توجد خدمات مطابقة للتصفية الحالية
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {onlyFavorites
              ? 'لم تقم بإضافة خدمات إلى المفضلة بعد — اضغط على أيقونة القلب في أي خدمة لإضافتها'
              : onlyInMyArea
              ? 'جرّب إلغاء خيار «المتاح في منطقتي فقط» لعرض أقرب الفنيين في المراكز المجاورة'
              : 'جرّب تغيير القسم أو البحث بكلمة أخرى'}
          </p>
          <button
            type="button"
            onClick={() => {
              onSelectCategoryId('all');
              setQuery('');
              setOnlyInMyArea(false);
              setOnlyFavorites(false);
            }}
            className="mt-2 px-5 py-2.5 min-h-[44px] bg-[#FF5A00] dark:bg-orange-600 text-white text-xs font-semibold rounded-xl hover:bg-orange-700 dark:hover:bg-orange-500 transition-colors cursor-pointer"
          >
            إعادة ضبط الفلاتر وعرض كل الخدمات
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((item) => {
            const { service, lowestAvailablePriceEGP, marketStats } = item;
            const cat = SERVICE_CATEGORIES.find((c) => c.id === service.categoryId);
            const isFavorite = favoriteServiceIds.includes(service.id);
            return (
              <article
                key={service.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-orange-500/60 dark:hover:border-orange-500/50 transition-colors"
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
                        <Star
                          className="w-3.5 h-3.5 fill-amber-500 text-amber-500"
                          aria-hidden="true"
                        />
                        {service.rating} ({service.reviewsCount})
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{service.estimatedDuration}</span>
                    </div>

                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {service.title}
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {service.summary}
                    </p>

                    <div className="pt-1 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium tabular-nums">
                        <Navigation
                          className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400 shrink-0"
                          aria-hidden="true"
                        />
                        <span>{formatProximitySummary(item)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-orange-700 dark:text-orange-400">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>ضمان {service.warrantyDays} يوماً · عروض مباشرة من الفنيين</span>
                      </div>
                    </div>

                    {lowestAvailablePriceEGP !== null &&
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
                  <div className="text-xs">
                    {lowestAvailablePriceEGP !== null ? (
                      <div className="space-y-0.5">
                        <span className="text-slate-500 dark:text-slate-400 block">
                          أقل عرض متاح:
                        </span>
                        <span className="font-bold text-orange-700 dark:text-orange-400 tabular-nums">
                          {formatEGP(lowestAvailablePriceEGP)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400">حسب عروض الفنيين</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onRequestService(service)}
                    className="px-5 py-2.5 min-h-[44px] bg-[#FF5A00] dark:bg-orange-600 text-white text-xs font-semibold rounded-xl hover:bg-orange-700 dark:hover:bg-orange-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    اطلب الخدمة بالتفصيل
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
