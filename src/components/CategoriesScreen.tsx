import {
  Banknote,
  ChevronDown,
  Heart,
  MapPin,
  Navigation,
  Search,
  Sparkles,
  Star,
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
      list.sort((a, b) =>
        a.minDistanceKm !== b.minDistanceKm
          ? a.minDistanceKm - b.minDistanceKm
          : b.availableCount - a.availableCount
      );
    } else if (sortBy === 'rating') {
      list.sort((a, b) =>
        b.service.rating !== a.service.rating
          ? b.service.rating - a.service.rating
          : b.service.reviewsCount - a.service.reviewsCount
      );
    } else if (sortBy === 'lowest_price') {
      list.sort((a, b) => {
        const aPrice = a.lowestAvailablePriceEGP;
        const bPrice = b.lowestAvailablePriceEGP;
        if (aPrice !== null && bPrice !== null) return aPrice - bPrice;
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
    { id: 'nearest', label: 'الأقرب', icon: Navigation },
    { id: 'rating', label: 'الأعلى تقييماً', icon: Star },
    { id: 'lowest_price', label: 'الأقل سعراً', icon: Banknote },
  ];

  return (
    <div className="max-w-7xl mx-auto px-3.5 md:px-6 py-4 md:py-6 space-y-4 pb-10">
      {/* Compact Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50">
            الخدمات
          </h1>
          <button
            type="button"
            onClick={onOpenLocation}
            className="md:hidden inline-flex items-center gap-1 min-h-[36px] px-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-200 max-w-[190px] cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-[#FF5A00] shrink-0" />
            <span className="truncate">{district}</span>
            <ChevronDown className="w-3 h-3 shrink-0" />
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search
            className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن خدمة..."
            className="w-full h-10 pr-9 pl-3 text-xs md:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:border-[#FF5A00] focus:outline-none"
          />
        </div>
      </div>

      {/* Category Strip with AI Thumbnails */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
        <button
          type="button"
          onClick={() => onSelectCategoryId('all')}
          className={`min-h-[40px] px-3.5 py-1.5 text-xs font-bold rounded-xl border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            selectedCategoryId === 'all'
              ? 'bg-[#FF5A00] dark:bg-orange-600 text-white border-[#FF5A00]'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
          }`}
        >
          الكل ({SERVICES_CATALOG.length})
        </button>

        {SERVICE_CATEGORIES.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategoryId(cat.id)}
              className={`min-h-[40px] pl-3 pr-1.5 py-1 text-xs font-bold rounded-xl border inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[#FF5A00] dark:bg-orange-600 text-white border-[#FF5A00]'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="w-6 h-6 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
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

      {/* Compact Sort & Quick Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {sortButtons.map((opt) => {
          const Icon = opt.icon;
          const isActive = sortBy === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setSortBy(opt.id)}
              className={`min-h-[38px] px-3 py-1.5 text-[11px] font-bold rounded-xl border inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#FF5A00] dark:bg-orange-600 text-white border-[#FF5A00]'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{opt.label}</span>
            </button>
          );
        })}

        <button
          type="button"
          aria-pressed={onlyFavorites}
          onClick={() => setOnlyFavorites((prev) => !prev)}
          className={`min-h-[38px] px-3 py-1.5 text-[11px] font-bold rounded-xl border inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            onlyFavorites
              ? 'bg-rose-600 text-white border-rose-600'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 shrink-0 ${onlyFavorites ? 'fill-white' : 'text-rose-500'}`} />
          <span className="tabular-nums">المفضلة ({favoriteServiceIds.length})</span>
        </button>

        <button
          type="button"
          aria-pressed={onlyInMyArea}
          onClick={() => setOnlyInMyArea((prev) => !prev)}
          className={`min-h-[38px] px-3 py-1.5 text-[11px] font-bold rounded-xl border inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            onlyInMyArea
              ? 'bg-slate-900 dark:bg-orange-600 text-white border-slate-900'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5 shrink-0" />
          <span>نطاقي</span>
        </button>
      </div>

      {/* Compact Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
            لا توجد خدمات مطابقة
          </p>
          <button
            type="button"
            onClick={() => {
              onSelectCategoryId('all');
              setQuery('');
              setOnlyInMyArea(false);
              setOnlyFavorites(false);
            }}
            className="px-4 py-2 min-h-[40px] bg-[#FF5A00] text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            عرض كل الخدمات
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-4">
          {filteredServices.map((item) => {
            const { service, lowestAvailablePriceEGP } = item;
            const cat = SERVICE_CATEGORIES.find((c) => c.id === service.categoryId);
            const isFavorite = favoriteServiceIds.includes(service.id);

            return (
              <article
                key={service.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-orange-500/60 transition-colors"
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
                        aria-label={
                          isFavorite ? `إزالة ${service.title} من المفضلة` : `إضافة ${service.title} للمفضلة`
                        }
                        className={`absolute top-2 left-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl border backdrop-blur-sm transition-colors cursor-pointer ${
                          isFavorite
                            ? 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 text-rose-600'
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

                    <h2 className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {service.title}
                    </h2>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {service.summary}
                    </p>
                  </div>
                </div>

                <div className="px-3 pb-3 pt-1 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-orange-700 dark:text-orange-400 tabular-nums truncate">
                    {lowestAvailablePriceEGP !== null
                      ? `من ${formatEGP(lowestAvailablePriceEGP)}`
                      : `ضمان ${service.warrantyDays}ي`}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRequestService(service)}
                    className="min-h-[36px] px-3 py-1.5 bg-[#FF5A00] dark:bg-orange-600 text-white text-xs font-bold rounded-xl hover:bg-orange-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    اطلب
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
