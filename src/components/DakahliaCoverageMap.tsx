import { Building2, Check, Compass, MapPin, Navigation, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DAKAHLIA_CENTER_COORDS, getLocationMeta } from '../data/dakahliaLocations';
import { LocationEntry, Technician } from '../types/khadamat';

interface DakahliaCoverageMapProps {
  locations: LocationEntry[];
  technicians: Technician[];
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  compact?: boolean;
  isDark?: boolean;
  onCenterFocused?: (center: string) => void;
}

// Approximate geographic bounds of Dakahlia Governorate
const MAP_BOUNDS = {
  minLat: 30.65,
  maxLat: 31.55,
  minLng: 31.18,
  maxLng: 32.12,
};

const SVG_W = 640;
const SVG_H = 440;
const PAD_X = 56;
const PAD_Y = 42;

function projectCoord(lat: number, lng: number): { x: number; y: number } {
  const normX = (lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng);
  const normY = (MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat);
  return {
    x: PAD_X + normX * (SVG_W - PAD_X * 2),
    y: PAD_Y + normY * (SVG_H - PAD_Y * 2),
  };
}

// Key geographic centers to display cleanly on the Dakahlia map
const MAP_CENTERS = [
  'المنصورة',
  'المنصورة الجديدة',
  'طلخا',
  'ميت غمر',
  'السنبلاوين',
  'دكرنس',
  'بلقاس',
  'شربين',
  'أجا',
  'منية النصر',
  'نبروه',
  'بني عبيد',
  'تمي الأمديد',
  'المنزلة',
  'جمصة',
  'المطرية',
  'الجمالية',
  'ميت سلسيل',
  'الكردي',
  'محلة دمنة',
];

// Slight label offsets (dx, dy) in SVG units so neighboring centers stay crisp and readable
const LABEL_OFFSETS: Record<
  string,
  { dx: number; dy: number; anchor?: 'start' | 'end' | 'middle' }
> = {
  المنصورة: { dx: 12, dy: 16, anchor: 'start' },
  'المنصورة الجديدة': { dx: -10, dy: -12, anchor: 'end' },
  طلخا: { dx: -10, dy: -12, anchor: 'end' },
  نبروه: { dx: -12, dy: 4, anchor: 'end' },
  أجا: { dx: -12, dy: 4, anchor: 'end' },
  'ميت غمر': { dx: 0, dy: 18, anchor: 'middle' },
  السنبلاوين: { dx: 0, dy: 17, anchor: 'middle' },
  'تمي الأمديد': { dx: 12, dy: 6, anchor: 'start' },
  'محلة دمنة': { dx: 0, dy: -12, anchor: 'middle' },
  دكرنس: { dx: -8, dy: 16, anchor: 'end' },
  'بني عبيد': { dx: 12, dy: 14, anchor: 'start' },
  'منية النصر': { dx: 10, dy: -12, anchor: 'start' },
  الكردي: { dx: 10, dy: 14, anchor: 'start' },
  شربين: { dx: 12, dy: 4, anchor: 'start' },
  بلقاس: { dx: -12, dy: 4, anchor: 'end' },
  جمصة: { dx: 10, dy: 14, anchor: 'start' },
  'ميت سلسيل': { dx: -10, dy: 14, anchor: 'end' },
  الجمالية: { dx: 0, dy: -13, anchor: 'middle' },
  المنزلة: { dx: 8, dy: 16, anchor: 'start' },
  المطرية: { dx: -8, dy: -13, anchor: 'end' },
};

export function DakahliaCoverageMap({
  locations,
  technicians,
  selectedDistrict,
  onSelectDistrict,
  compact = false,
  isDark = false,
  onCenterFocused,
}: DakahliaCoverageMapProps) {
  const currentMeta = useMemo(
    () => getLocationMeta(selectedDistrict, locations),
    [selectedDistrict, locations]
  );

  const [focusedCenter, setFocusedCenter] = useState<string>(currentMeta.center || 'المنصورة');

  const centerNodes = useMemo(() => {
    return MAP_CENTERS.map((center) => {
      const coords = DAKAHLIA_CENTER_COORDS[center] || DAKAHLIA_CENTER_COORDS['المنصورة'];
      const pos = projectCoord(coords.lat, coords.lng);
      const centerLocations = locations.filter((l) => l.center === center);
      const directTechs = technicians.filter(
        (t) => t.primaryCenter === center || t.coveredCenters.includes(center)
      );
      return {
        center,
        pos,
        locationsCount: centerLocations.length,
        techsCount: directTechs.length,
        directTechs,
        centerLocations,
      };
    });
  }, [locations, technicians]);

  const activeNode = useMemo(
    () => centerNodes.find((n) => n.center === focusedCenter) || centerNodes[0],
    [centerNodes, focusedCenter]
  );

  // Stylized Nile Damietta Branch path connecting Meet Ghamr -> Aga -> Mansoura/Talkha -> Shirbin -> North
  const nilePath = useMemo(() => {
    const pts = [
      projectCoord(30.69, 31.25),
      projectCoord(30.72, 31.26), // Meet Ghamr
      projectCoord(30.94, 31.29), // Aga
      projectCoord(31.045, 31.378), // Mansoura / Talkha
      projectCoord(31.2, 31.52), // Shirbin
      projectCoord(31.38, 31.56), // North toward Mediterranean
    ];
    return `M ${pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
  }, []);

  // Approximate boundary polygon of Dakahlia Governorate
  const govBoundaryPoints = useMemo(() => {
    const corners = [
      [31.49, 31.35],
      [31.47, 31.65],
      [31.25, 32.06],
      [31.12, 32.08],
      [30.92, 31.68],
      [30.68, 31.3],
      [30.72, 31.21],
      [31.15, 31.23],
      [31.32, 31.28],
    ];
    return corners
      .map(([lat, lng]) => {
        const p = projectCoord(lat, lng);
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(' ');
  }, []);

  const coveredCentersCount = centerNodes.filter((n) => n.techsCount > 0).length;

  const handleSelectPin = (center: string) => {
    setFocusedCenter(center);
    onCenterFocused?.(center);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
      {/* Map Canvas */}
      <div
        className={`${
          compact ? 'lg:col-span-7' : 'lg:col-span-8'
        } bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col`}
      >
        <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
            <Compass className="w-4 h-4 text-[#FF5A00] dark:text-orange-400" />
            <span>خريطة الدقهلية</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5A00] dark:bg-orange-400 inline-block" />
              تغطية مباشرة ({coveredCentersCount})
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
              توجيه للأقرب
            </span>
          </div>
        </div>

        <div className="relative flex-1 bg-gradient-to-b from-sky-50/60 via-slate-50 to-orange-50/35 dark:from-slate-950 dark:via-slate-900 dark:to-orange-950/25 p-2">
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full h-auto max-h-[380px] select-none"
            role="img"
            aria-label="خريطة مراكز محافظة الدقهلية"
          >
            {/* Subtle Coordinate Grid */}
            <defs>
              <pattern id="dakahlia-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke={isDark ? '#1e293b' : '#e2e8f0'}
                  strokeWidth="0.7"
                />
              </pattern>
            </defs>
            <rect width={SVG_W} height={SVG_H} fill="url(#dakahlia-grid)" />

            {/* North Sea / Lake Manzala subtle tint */}
            <path
              d={`M 0,0 L ${SVG_W},0 L ${SVG_W},54 Q 440,68 250,42 Q 110,25 0,48 Z`}
              fill={isDark ? '#0c4a6e' : '#e0f2fe'}
              opacity={isDark ? '0.45' : '0.75'}
            />
            <text
              x="150"
              y="24"
              fontSize="11"
              fill={isDark ? '#7dd3fc' : '#0369a1'}
              fontWeight="600"
              textAnchor="middle"
            >
              البحر المتوسط
            </text>
            <text
              x="540"
              y="130"
              fontSize="11"
              fill={isDark ? '#7dd3fc' : '#0369a1'}
              fontWeight="600"
              textAnchor="middle"
            >
              بحيرة المنزلة
            </text>

            {/* Governorate Polygon */}
            <polygon
              points={govBoundaryPoints}
              fill={isDark ? '#0f172a' : '#ffffff'}
              fillOpacity={isDark ? '0.92' : '0.88'}
              stroke={isDark ? '#fb923c' : '#ea580c'}
              strokeOpacity={isDark ? '0.35' : '0.28'}
              strokeWidth="2"
              strokeLinejoin="round"
            />

            {/* Nile Damietta Branch */}
            <path
              d={nilePath}
              fill="none"
              stroke={isDark ? '#0284c7' : '#7dd3fc'}
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={isDark ? '0.7' : '0.85'}
            />

            {/* Proximity Connector Lines */}
            {activeNode &&
              activeNode.techsCount === 0 &&
              centerNodes
                .filter((n) => n.techsCount > 0)
                .slice(0, 2)
                .map((near) => (
                  <line
                    key={`near-${near.center}`}
                    x1={activeNode.pos.x}
                    y1={activeNode.pos.y}
                    x2={near.pos.x}
                    y2={near.pos.y}
                    stroke={isDark ? '#fb923c' : '#ea580c'}
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    opacity="0.55"
                  />
                ))}

            {/* Center Pins */}
            {centerNodes.map((node) => {
              const isSelectedCenter = node.center === currentMeta.center;
              const isFocused = node.center === activeNode?.center;
              const hasDirectTech = node.techsCount > 0;
              const offset = LABEL_OFFSETS[node.center] || {
                dx: 0,
                dy: -12,
                anchor: 'middle',
              };

              return (
                <g
                  key={node.center}
                  onClick={() => handleSelectPin(node.center)}
                  className="cursor-pointer group"
                >
                  {hasDirectTech && (
                    <circle
                      cx={node.pos.x}
                      cy={node.pos.y}
                      r={isFocused ? 22 : 15}
                      fill={isDark ? '#f97316' : '#FF5A00'}
                      fillOpacity={isFocused ? 0.2 : 0.11}
                    />
                  )}

                  {(isFocused || isSelectedCenter) && (
                    <circle
                      cx={node.pos.x}
                      cy={node.pos.y}
                      r={12}
                      fill="none"
                      stroke={
                        isFocused
                          ? isDark
                            ? '#fb923c'
                            : '#FF5A00'
                          : isDark
                            ? '#e2e8f0'
                            : '#0f172a'
                      }
                      strokeWidth={isFocused ? 2.2 : 1.5}
                    />
                  )}

                  <circle
                    cx={node.pos.x}
                    cy={node.pos.y}
                    r={isFocused ? 8 : hasDirectTech ? 6.5 : 5}
                    fill={
                      hasDirectTech
                        ? isDark
                          ? '#f97316'
                          : '#FF5A00'
                        : isDark
                          ? '#94a3b8'
                          : '#64748b'
                    }
                    stroke={isDark ? '#0f172a' : '#ffffff'}
                    strokeWidth="2"
                  />

                  <text
                    x={node.pos.x + offset.dx}
                    y={node.pos.y + offset.dy}
                    textAnchor={offset.anchor || 'middle'}
                    fontSize={isFocused || node.center === 'المنصورة' ? '12' : '10.5'}
                    fontWeight={isFocused || isSelectedCenter ? '700' : '600'}
                    fill={
                      isFocused ? (isDark ? '#fb923c' : '#c2410c') : isDark ? '#e2e8f0' : '#1e293b'
                    }
                    style={{
                      paintOrder: 'stroke',
                      stroke: isDark ? '#0f172a' : '#ffffff',
                      strokeWidth: '3px',
                      strokeLinejoin: 'round',
                    }}
                  >
                    {node.center}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="px-3 pb-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>اضغط على أي مركز لاختيار المنطقة</span>
            <span className="tabular-nums font-medium text-orange-700 dark:text-orange-400">
              {locations.length} منطقة وقرية
            </span>
          </div>
        </div>
      </div>

      {/* Selected Center Detail & Quick Area Picker */}
      <div
        className={`${
          compact ? 'lg:col-span-5' : 'lg:col-span-4'
        } bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3`}
      >
        {activeNode && (
          <>
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-[11px] font-semibold text-orange-700 dark:text-orange-400">
                    النطاق المختار
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {activeNode.center}
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                  <Users className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400" />
                  {activeNode.techsCount > 0 ? `${activeNode.techsCount} فني/شركة` : 'أقرب مركز'}
                </span>
              </div>

              {activeNode.directTechs.length > 0 ? (
                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    متاحون في {activeNode.center}:
                  </div>
                  <div className="space-y-1">
                    {activeNode.directTechs.slice(0, 3).map((t) => (
                      <div key={t.id} className="flex items-center gap-1.5 truncate">
                        {t.isCompany ? (
                          <Building2 className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                        ) : (
                          <Navigation className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                        )}
                        <span className="truncate">{t.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  عند اختيار {activeNode.center} يُرسل الطلب تلقائياً لأقرب فنيين.
                </div>
              )}

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  اختر المنطقة ({activeNode.locationsCount}):
                </div>
                <div className="max-h-[195px] overflow-y-auto space-y-1.5 pr-0.5">
                  {activeNode.centerLocations.map((loc) => {
                    const isPicked = loc.displayLabel === selectedDistrict;
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => onSelectDistrict(loc.displayLabel)}
                        className={`w-full px-3 py-2 min-h-[40px] rounded-xl border text-right text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                          isPicked
                            ? 'bg-[#FF5A00] dark:bg-orange-600 text-white border-[#FF5A00] dark:border-orange-600 font-semibold'
                            : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500 hover:bg-white dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{loc.name}</span>
                        </span>
                        {isPicked && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
              المحدد:{' '}
              <strong className="text-slate-800 dark:text-slate-200">{selectedDistrict}</strong>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
