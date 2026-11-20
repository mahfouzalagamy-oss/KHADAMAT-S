import { LocationEntry, Technician } from '../types/khadamat';

export const DAKAHLIA_CENTER_COORDS: Record<string, { lat: number; lng: number }> = {
  المنصورة: { lat: 31.0409, lng: 31.3785 },
  'المنصورة الجديدة': { lat: 31.462, lng: 31.425 },
  طلخا: { lat: 31.0537, lng: 31.3779 },
  'ميت غمر': { lat: 30.7192, lng: 31.2628 },
  السنبلاوين: { lat: 30.8833, lng: 31.4667 },
  دكرنس: { lat: 31.0894, lng: 31.5944 },
  بلقاس: { lat: 31.2144, lng: 31.3586 },
  شربين: { lat: 31.1969, lng: 31.5244 },
  أجا: { lat: 30.9417, lng: 31.2903 },
  'منية النصر': { lat: 31.1275, lng: 31.6442 },
  نبروه: { lat: 31.1167, lng: 31.2833 },
  'بني عبيد': { lat: 31.0167, lng: 31.65 },
  'تمي الأمديد': { lat: 30.95, lng: 31.5167 },
  المنزلة: { lat: 31.1583, lng: 31.9369 },
  جمصة: { lat: 31.4414, lng: 31.5314 },
  المطرية: { lat: 31.1833, lng: 32.0333 },
  الجمالية: { lat: 31.1806, lng: 31.8639 },
  'ميت سلسيل': { lat: 31.1333, lng: 31.8167 },
  الكردي: { lat: 31.1489, lng: 31.7167 },
  'محلة دمنة': { lat: 31.0631, lng: 31.5117 },
  'مدن ومراكز أخرى بالدقهلية': { lat: 31.15, lng: 31.75 },
};

const SORTED_COORD_ENTRIES = Object.entries(DAKAHLIA_CENTER_COORDS).sort(
  ([a], [b]) => b.length - a.length
);

function resolveCoords(center: string, name: string): { lat: number; lng: number } {
  if (DAKAHLIA_CENTER_COORDS[center]) {
    return DAKAHLIA_CENTER_COORDS[center];
  }
  for (const [key, coords] of SORTED_COORD_ENTRIES) {
    if (name.includes(key)) {
      return coords;
    }
  }
  return DAKAHLIA_CENTER_COORDS['المنصورة'];
}

const createEntry = (
  center: string,
  name: string,
  isVillage = false,
  isCustom = false
): LocationEntry => {
  const coords = resolveCoords(center, name);
  return {
    id: `الدقهلية-${center}-${name}`,
    governorate: 'الدقهلية',
    center,
    name,
    displayLabel: `الدقهلية · ${center === name ? name : `${center} - ${name}`}`,
    lat: coords.lat,
    lng: coords.lng,
    isVillage,
    isCustom,
  };
};

export function createCustomLocationEntry(center: string, name: string): LocationEntry {
  const trimmedName = name.trim();
  const cleanCenter = center.trim() || 'المنصورة';
  return createEntry(cleanCenter, trimmedName, true, true);
}

const DAKAHLIA_CENTERS_DATA: { center: string; places: { name: string; isVillage?: boolean }[] }[] =
  [
    {
      center: 'المنصورة',
      places: [
        { name: 'المنصورة (حي شرق - توريل - قناة السويس - جديلة)' },
        { name: 'المنصورة (حي غرب - المشاية - الجامعة - الجلاء)' },
        { name: 'المنصورة (سندوب - الدراسات - المجزر)' },
        { name: 'شاوة', isVillage: true },
        { name: 'ميت خميس', isVillage: true },
        { name: 'أويش الحجر', isVillage: true },
        { name: 'كوم الدربي', isVillage: true },
        { name: 'طناح', isVillage: true },
        { name: 'دموه', isVillage: true },
        { name: 'تلبانة', isVillage: true },
        { name: 'سلكا', isVillage: true },
        { name: 'الخيارية', isVillage: true },
        { name: 'بدواي', isVillage: true },
        { name: 'البرامون', isVillage: true },
        { name: 'نقيطة', isVillage: true },
        { name: 'ميت الصارم', isVillage: true },
        { name: 'ميت علي', isVillage: true },
        { name: 'بلجاي', isVillage: true },
        { name: 'ميت محمود', isVillage: true },
        { name: 'منية سندوب', isVillage: true },
        { name: 'ميت بدر خميس', isVillage: true },
        { name: 'كفر البدماص', isVillage: true },
        { name: 'الخليج', isVillage: true },
      ],
    },
    {
      center: 'المنصورة الجديدة',
      places: [
        { name: 'جنة 1 (Janna 1)' },
        { name: 'جنة 2 (Janna 2)' },
        { name: 'جنة 3 (Janna 3)' },
        { name: 'جنة 4 (Janna 4)' },
        { name: 'سكن مصر' },
        { name: 'الإسكان المتميز' },
        { name: 'الإسكان الساحلي (الاجتماعي)' },
        { name: 'كمبوند زاهية' },
        { name: 'منطقة الفيلات الساحلية' },
        { name: 'الكورنيش والممشى السياحي' },
        { name: 'المارينا والمنطقة الشاطئية' },
        { name: 'جامعة المنصورة الجديدة' },
        { name: 'الحي الدبلوماسي والمنطقة المركزية' },
        { name: 'المرحلة الأولى' },
        { name: 'المرحلة الثانية' },
      ],
    },
    {
      center: 'طلخا',
      places: [
        { name: 'مدينة طلخا' },
        { name: 'تقسيم عمرو بن العاص' },
        { name: 'ميت الكرماء', isVillage: true },
        { name: 'ميت عنتر', isVillage: true },
        { name: 'بطرة', isVillage: true },
        { name: 'المنيل', isVillage: true },
        { name: 'بساط', isVillage: true },
        { name: 'كتامة', isVillage: true },
        { name: 'ديسط', isVillage: true },
        { name: 'دميرة', isVillage: true },
        { name: 'كفر دميرة القديم والجديد', isVillage: true },
        { name: 'ميت زنقر', isVillage: true },
        { name: 'أورمان طلخا', isVillage: true },
      ],
    },
    {
      center: 'ميت غمر',
      places: [
        { name: 'مدينة ميت غمر' },
        { name: 'دقادوس', isVillage: true },
        { name: 'ميت الفرماوي', isVillage: true },
        { name: 'دماص', isVillage: true },
        { name: 'أتميدة', isVillage: true },
        { name: 'ميت محسن', isVillage: true },
        { name: 'بشلا', isVillage: true },
        { name: 'كوم النور', isVillage: true },
        { name: 'سنفا', isVillage: true },
        { name: 'صهرجت الكبرى', isVillage: true },
        { name: 'ميت يعيش', isVillage: true },
        { name: 'ميت ناجي', isVillage: true },
        { name: 'تفهنا الأشراف', isVillage: true },
        { name: 'أوليلة', isVillage: true },
        { name: 'سنتماي', isVillage: true },
        { name: 'هلا', isVillage: true },
        { name: 'جصفا', isVillage: true },
      ],
    },
    {
      center: 'السنبلاوين',
      places: [
        { name: 'مدينة السنبلاوين' },
        { name: 'المقاطعة', isVillage: true },
        { name: 'شبرا سندي', isVillage: true },
        { name: 'البلامون', isVillage: true },
        { name: 'طنبول الكبرى', isVillage: true },
        { name: 'برهمتوش', isVillage: true },
        { name: 'ميت غراب', isVillage: true },
        { name: 'كفر غنام', isVillage: true },
        { name: 'طماي الزهايرة', isVillage: true },
        { name: 'الزريقي', isVillage: true },
        { name: 'الحجايزة', isVillage: true },
        { name: 'برقين', isVillage: true },
        { name: 'غزالة', isVillage: true },
      ],
    },
    {
      center: 'دكرنس',
      places: [
        { name: 'مدينة دكرنس' },
        { name: 'ميت طريف', isVillage: true },
        { name: 'نجير', isVillage: true },
        { name: 'ميت السودان', isVillage: true },
        { name: 'أشمون الرمان', isVillage: true },
        { name: 'كفر أبو ناصر', isVillage: true },
        { name: 'ميت رومي', isVillage: true },
        { name: 'ديمشلت', isVillage: true },
        { name: 'القباب الكبرى والصغرى', isVillage: true },
        { name: 'العزازنة', isVillage: true },
      ],
    },
    {
      center: 'بلقاس',
      places: [
        { name: 'مدينة بلقاس' },
        { name: 'الستاموني', isVillage: true },
        { name: 'المعصرة', isVillage: true },
        { name: 'بسنديلة', isVillage: true },
        { name: 'قلبشو', isVillage: true },
        { name: 'بلقاس خامس', isVillage: true },
        { name: 'كفر الغاب', isVillage: true },
        { name: 'الحفير والأمل', isVillage: true },
        { name: 'الشوامي', isVillage: true },
      ],
    },
    {
      center: 'شربين',
      places: [
        { name: 'مدينة شربين' },
        { name: 'بساط كريم الدين', isVillage: true },
        { name: 'كفر الترعة الجديد والقديم', isVillage: true },
        { name: 'رأس الخليج', isVillage: true },
        { name: 'الضهرية', isVillage: true },
        { name: 'دنجواي', isVillage: true },
        { name: 'محلة إنجاق', isVillage: true },
        { name: 'الأحمدية', isVillage: true },
        { name: 'الحصص', isVillage: true },
      ],
    },
    {
      center: 'أجا',
      places: [
        { name: 'مدينة أجا' },
        { name: 'ميت العامل', isVillage: true },
        { name: 'منية سمنود', isVillage: true },
        { name: 'نوسا الغيط', isVillage: true },
        { name: 'نوسا البحر', isVillage: true },
        { name: 'ميت دمسيس', isVillage: true },
        { name: 'صهرجت الصغرى', isVillage: true },
        { name: 'بقطارس', isVillage: true },
        { name: 'شنشا', isVillage: true },
        { name: 'شبراويش', isVillage: true },
        { name: 'فيشا بنا', isVillage: true },
        { name: 'البوهي فريك', isVillage: true },
      ],
    },
    {
      center: 'منية النصر',
      places: [
        { name: 'مدينة منية النصر' },
        { name: 'ميت عاصم', isVillage: true },
        { name: 'برمبال الجديدة والقديمة', isVillage: true },
        { name: 'الدراكسة', isVillage: true },
        { name: 'البجلات', isVillage: true },
        { name: 'ميت الخولي مؤمن', isVillage: true },
        { name: 'النزل', isVillage: true },
      ],
    },
    {
      center: 'نبروه',
      places: [
        { name: 'مدينة نبروه' },
        { name: 'بهوت', isVillage: true },
        { name: 'تيرة', isVillage: true },
        { name: 'درين', isVillage: true },
        { name: 'طنيخ', isVillage: true },
        { name: 'نشا', isVillage: true },
        { name: 'بانوب', isVillage: true },
        { name: 'الطيبة', isVillage: true },
      ],
    },
    {
      center: 'بني عبيد',
      places: [
        { name: 'مدينة بني عبيد' },
        { name: 'الصلاحات', isVillage: true },
        { name: 'ميت سويد', isVillage: true },
        { name: 'اليوسيفية', isVillage: true },
        { name: 'ديرب الخضر', isVillage: true },
        { name: 'ميت عدلان', isVillage: true },
      ],
    },
    {
      center: 'تمي الأمديد',
      places: [
        { name: 'مدينة تمي الأمديد' },
        { name: 'الربع', isVillage: true },
        { name: 'صدقا', isVillage: true },
        { name: 'تاج العز', isVillage: true },
        { name: 'ظفر', isVillage: true },
        { name: 'أبو داود', isVillage: true },
        { name: 'السمارة', isVillage: true },
      ],
    },
    {
      center: 'المنزلة',
      places: [
        { name: 'مدينة المنزلة' },
        { name: 'العزيزة', isVillage: true },
        { name: 'الفروسات', isVillage: true },
        { name: 'العامرة', isVillage: true },
        { name: 'البصراط', isVillage: true },
        { name: 'الحوتة', isVillage: true },
        { name: 'ميت شريف', isVillage: true },
      ],
    },
    {
      center: 'جمصة',
      places: [
        { name: 'مدينة جمصة' },
        { name: '15 مايو (جمصة)' },
        { name: 'منطقة الكورنيش (جمصة)' },
      ],
    },
    {
      center: 'المطرية',
      places: [{ name: 'مدينة المطرية' }, { name: 'العصافرة (المطرية)', isVillage: true }],
    },
    {
      center: 'الجمالية',
      places: [{ name: 'مدينة الجمالية' }, { name: 'ميت مرجا سلسيل (الجمالية)', isVillage: true }],
    },
    {
      center: 'ميت سلسيل',
      places: [
        { name: 'مدينة ميت سلسيل' },
        { name: 'الكفر الجديد والجوابر (ميت سلسيل)', isVillage: true },
      ],
    },
    {
      center: 'الكردي',
      places: [{ name: 'مدينة الكردي' }],
    },
    {
      center: 'محلة دمنة',
      places: [{ name: 'مدينة محلة دمنة' }, { name: 'منشأة عاصم وكفر دمنة', isVillage: true }],
    },
  ];

export const DAKAHLIA_CENTERS = DAKAHLIA_CENTERS_DATA.map((c) => c.center);

export const EGYPT_LOCATIONS: LocationEntry[] = DAKAHLIA_CENTERS_DATA.flatMap((group) =>
  group.places.map((p) => createEntry(group.center, p.name, p.isVillage, false))
);

export const DEFAULT_DAKAHLIA_DISTRICT =
  'الدقهلية · المنصورة - المنصورة (حي شرق - توريل - قناة السويس - جديلة)';

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function getLocationMeta(
  districtLabel: string,
  allLocations: LocationEntry[] = EGYPT_LOCATIONS
): { center: string; areaName: string; lat: number; lng: number } {
  const found = allLocations.find((l) => l.displayLabel === districtLabel);
  if (found) {
    return {
      center: found.center,
      areaName: found.name,
      lat: found.lat,
      lng: found.lng,
    };
  }

  const centersByLength = [...DAKAHLIA_CENTERS].sort((a, b) => b.length - a.length);
  for (const center of centersByLength) {
    if (districtLabel.includes(center)) {
      const coords = DAKAHLIA_CENTER_COORDS[center] || DAKAHLIA_CENTER_COORDS['المنصورة'];
      const parts = districtLabel.split(' - ');
      return {
        center,
        areaName: parts[1]?.trim() || center,
        lat: coords.lat,
        lng: coords.lng,
      };
    }
  }

  const fallback = DAKAHLIA_CENTER_COORDS['المنصورة'];
  return {
    center: 'المنصورة',
    areaName: districtLabel || 'المنصورة',
    lat: fallback.lat,
    lng: fallback.lng,
  };
}

export interface ProximityRoutingResult {
  targets: {
    technician: Technician;
    distanceKm: number;
    matchType: 'exact_area' | 'exact_center' | 'nearest_center';
  }[];
  matchType: 'exact_area' | 'exact_center' | 'nearest_center';
  nearestCenterName: string;
  minDistanceKm: number;
}

/**
 * Smart Proximity Routing:
 * 1) Exact area/village match for specialists in the service category.
 * 2) Exact Dakahlia center match for specialists in the service category.
 * 3) Nearest Dakahlia center(s) sorted ascending by distance ("للأقرب ثم الأقرب").
 */
export function findNearestMatchingTechnicians(
  categoryId: string,
  customerDistrict: string,
  technicians: Technician[],
  allLocations: LocationEntry[] = EGYPT_LOCATIONS
): ProximityRoutingResult {
  const customerLoc = getLocationMeta(customerDistrict, allLocations);
  const categorySpecialists = technicians.filter((t) => t.categoryIds.includes(categoryId));
  const pool = categorySpecialists.length > 0 ? categorySpecialists : technicians;

  // Tier 1: Exact area / village match
  const exactAreaMatches = pool.filter(
    (t) =>
      t.coveredAreas.some(
        (a) =>
          a === customerDistrict ||
          a.includes(customerLoc.areaName) ||
          customerLoc.areaName.includes(a)
      ) || t.area.includes(customerLoc.areaName)
  );

  if (exactAreaMatches.length > 0) {
    return {
      targets: exactAreaMatches.map((technician) => ({
        technician,
        distanceKm: 0,
        matchType: 'exact_area',
      })),
      matchType: 'exact_area',
      nearestCenterName: customerLoc.center,
      minDistanceKm: 0,
    };
  }

  // Tier 2: Exact Dakahlia center match
  const exactCenterMatches = pool.filter((t) => {
    if (t.primaryCenter === customerLoc.center || t.coveredCenters.includes(customerLoc.center)) {
      return true;
    }
    const areaTokens = t.area
      .replace('الدقهلية · ', '')
      .split(/[،-]/)
      .map((s) => s.trim())
      .filter(Boolean);
    return areaTokens.includes(customerLoc.center);
  });

  if (exactCenterMatches.length > 0) {
    return {
      targets: exactCenterMatches.map((technician) => ({
        technician,
        distanceKm: 3,
        matchType: 'exact_center',
      })),
      matchType: 'exact_center',
      nearestCenterName: customerLoc.center,
      minDistanceKm: 3,
    };
  }

  // Tier 3: Nearest center(s) by geographic distance ("الأقرب ثم الأقرب")
  const scored = pool
    .map((tech) => {
      const candidateCenters = [tech.primaryCenter, ...tech.coveredCenters].filter(Boolean);
      let bestDist = Infinity;
      for (const centerName of candidateCenters) {
        const coords = DAKAHLIA_CENTER_COORDS[centerName];
        if (coords) {
          const dist = haversineKm(customerLoc.lat, customerLoc.lng, coords.lat, coords.lng);
          if (dist < bestDist) bestDist = dist;
        }
      }
      if (!Number.isFinite(bestDist)) {
        const fallbackCoords = DAKAHLIA_CENTER_COORDS['المنصورة'];
        bestDist = haversineKm(
          customerLoc.lat,
          customerLoc.lng,
          fallbackCoords.lat,
          fallbackCoords.lng
        );
      }
      return { technician: tech, distanceKm: Math.max(4, bestDist) };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const minDistanceKm = scored[0]?.distanceKm ?? 0;
  // Notify closest technician(s) within +10km of the closest center match
  const closestTargets = scored
    .filter((item) => item.distanceKm <= minDistanceKm + 10)
    .map((item) => ({
      technician: item.technician,
      distanceKm: item.distanceKm,
      matchType: 'nearest_center' as const,
    }));

  return {
    targets: closestTargets,
    matchType: 'nearest_center',
    nearestCenterName: closestTargets[0]?.technician.primaryCenter || customerLoc.center,
    minDistanceKm,
  };
}
