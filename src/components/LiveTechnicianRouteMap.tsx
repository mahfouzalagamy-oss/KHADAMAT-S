import {
  Clock,
  Home,
  MapPin,
  Navigation,
  RefreshCw,
  Route,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  DAKAHLIA_CENTER_COORDS,
  getLocationMeta,
  haversineKm,
} from '../data/dakahliaLocations';
import {
  ServiceQuote,
  ServiceRequest,
  Technician,
} from '../types/khadamat';

export interface LiveTripMetrics {
  originCenter: string;
  destinationCenter: string;
  destinationArea: string;
  totalDistanceKm: number;
  remainingKm: number;
  etaMinutes: number;
  arrivalTimeLabel: string;
  progress: number;
  corridorLabel: string;
}

function deterministicFraction(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 1000;
  }
  return hash / 1000;
}

export function computeLiveTripMetrics(
  request: ServiceRequest,
  quote?: ServiceQuote | null,
  technicians: Technician[] = [],
  nowMs: number = Date.now(),
  fallbackAnchorMs?: number
): LiveTripMetrics {
  const customerLoc = getLocationMeta(request.district);
  const tech = technicians.find((t) => t.id === quote?.technicianId);
  const originCenter = tech?.primaryCenter || customerLoc.center || 'المنصورة';

  const techCoords =
    DAKAHLIA_CENTER_COORDS[originCenter] || DAKAHLIA_CENTER_COORDS['المنصورة'];
  const rawKm = haversineKm(
    techCoords.lat,
    techCoords.lng,
    customerLoc.lat,
    customerLoc.lng
  );

  const jitter = deterministicFraction(request.id);
  const totalDistanceKm =
    rawKm < 3
      ? Number((4.2 + jitter * 2.1).toFixed(1))
      : Number(Math.min(22, Math.max(4.4, rawKm * 1.15)).toFixed(1));

  const startedAt =
    request.enRouteStartedAt ?? fallbackAnchorMs ?? nowMs - 2 * 60 * 1000;
  const elapsedSeconds = Math.max(0, (nowMs - startedAt) / 1000);
  // Estimated urban/inter-city trip window (~135 seconds per km, minimum 4 min)
  const expectedTripSeconds = Math.max(240, Math.round(totalDistanceKm * 135));
  const rawProgress = 0.22 + (elapsedSeconds / expectedTripSeconds) * 0.72;
  const progress = Math.min(0.94, Math.max(0.22, rawProgress));

  const remainingKm = Math.max(
    0.2,
    Number((totalDistanceKm * (1 - progress)).toFixed(1))
  );
  const etaMinutes = Math.max(1, Math.ceil(remainingKm * 2.4));

  const arrivalDate = new Date(nowMs + etaMinutes * 60 * 1000);
  const hours24 = arrivalDate.getHours();
  const minutes = arrivalDate.getMinutes().toString().padStart(2, '0');
  const period = hours24 >= 12 ? 'م' : 'ص';
  const hours12 = (hours24 % 12 || 12).toString();
  const arrivalTimeLabel = `${hours12}:${minutes} ${period}`;

  const corridorLabel =
    originCenter === customerLoc.center
      ? `محور ${customerLoc.center} الداخلي`
      : `طريق ${originCenter} – ${customerLoc.center}`;

  return {
    originCenter,
    destinationCenter: customerLoc.center,
    destinationArea: customerLoc.areaName,
    totalDistanceKm,
    remainingKm,
    etaMinutes,
    arrivalTimeLabel,
    progress,
    corridorLabel,
  };
}

interface Point2D {
  x: number;
  y: number;
}

const ROUTE_P0: Point2D = { x: 540, y: 168 };
const ROUTE_P1: Point2D = { x: 432, y: 52 };
const ROUTE_P2: Point2D = { x: 222, y: 188 };
const ROUTE_P3: Point2D = { x: 100, y: 68 };

function evalCubicBezier(t: number): Point2D {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  return {
    x:
      uuu * ROUTE_P0.x +
      3 * uu * t * ROUTE_P1.x +
      3 * u * tt * ROUTE_P2.x +
      ttt * ROUTE_P3.x,
    y:
      uuu * ROUTE_P0.y +
      3 * uu * t * ROUTE_P1.y +
      3 * u * tt * ROUTE_P2.y +
      ttt * ROUTE_P3.y,
  };
}

function evalCubicTangentAngleDeg(t: number): number {
  const u = 1 - t;
  const dx =
    3 * u * u * (ROUTE_P1.x - ROUTE_P0.x) +
    6 * u * t * (ROUTE_P2.x - ROUTE_P1.x) +
    3 * t * t * (ROUTE_P3.x - ROUTE_P2.x);
  const dy =
    3 * u * u * (ROUTE_P1.y - ROUTE_P0.y) +
    6 * u * t * (ROUTE_P2.y - ROUTE_P1.y) +
    3 * t * t * (ROUTE_P3.y - ROUTE_P2.y);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

function buildSampledPath(tStart: number, tEnd: number, steps = 28): string {
  const pts: string[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = tStart + ((tEnd - tStart) * i) / steps;
    const pt = evalCubicBezier(t);
    pts.push(`${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`);
  }
  return pts.join(' ');
}

interface LiveTechnicianRouteMapProps {
  request: ServiceRequest;
  quote: ServiceQuote;
  technicians?: Technician[];
  isDark?: boolean;
}

export function LiveTechnicianRouteMap({
  request,
  quote,
  technicians = [],
  isDark = false,
}: LiveTechnicianRouteMapProps) {
  const [fallbackAnchorMs] = useState<number>(() => Date.now() - 2 * 60 * 1000);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [focusArrival, setFocusArrival] = useState(false);
  const [lastPingSecondsAgo, setLastPingSecondsAgo] = useState(0);

  // Live 2-second ticker so remaining distance, progress & ETA update dynamically
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
      setLastPingSecondsAgo((prev) => (prev + 2) % 60);
    }, 2000);
    return () => window.clearInterval(timer);
  }, []);

  const trip = useMemo(
    () =>
      computeLiveTripMetrics(
        request,
        quote,
        technicians,
        nowMs,
        fallbackAnchorMs
      ),
    [request, quote, technicians, nowMs, fallbackAnchorMs]
  );

  const techPos = useMemo(
    () => evalCubicBezier(trip.progress),
    [trip.progress]
  );
  const techAngleDeg = useMemo(
    () => evalCubicTangentAngleDeg(trip.progress),
    [trip.progress]
  );

  const completedPath = useMemo(
    () => buildSampledPath(0, trip.progress, 28),
    [trip.progress]
  );
  const remainingPath = useMemo(
    () => buildSampledPath(trip.progress, 1, 24),
    [trip.progress]
  );
  const midpointLandmark = useMemo(() => evalCubicBezier(0.52), []);

  const handleManualRefresh = () => {
    setNowMs(Date.now());
    setLastPingSecondsAgo(0);
  };

  const viewBox = focusArrival ? '40 15 410 190' : '0 0 640 230';

  const bgFill = isDark ? '#0f172a' : '#f8fafc';
  const gridStroke = isDark ? '#1e293b' : '#e2e8f0';
  const roadSecondaryStroke = isDark ? '#334155' : '#cbd5e1';
  const waterStroke = isDark ? '#1e3a5f' : '#dbeafe';
  const remainingStroke = isDark ? '#475569' : '#94a3b8';
  const activeRouteStroke = isDark ? '#fb923c' : '#FF5A00';
  const cardSurface = isDark ? '#020617' : '#ffffff';
  const labelTextFill = isDark ? '#f1f5f9' : '#0f172a';
  const subTextFill = isDark ? '#94a3b8' : '#475569';

  const progressPercent = Math.round(trip.progress * 100);
  const calloutY = techPos.y > 110 ? techPos.y - 26 : techPos.y + 34;

  return (
    <section
      aria-label="تتبع الفني اللحظي"
      className="bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-800/80 rounded-2xl p-4 md:p-5 space-y-4"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#FF5A00] dark:bg-orange-600 text-white flex items-center justify-center shrink-0">
            <Navigation className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                تتبع الفني اللحظي
              </h3>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                ·
              </span>
              <span className="font-bold text-orange-700 dark:text-orange-400 tabular-nums">
                متبقي {trip.remainingKm} كم · الوصول خلال {trip.etaMinutes}{' '}
                {trip.etaMinutes <= 10 && trip.etaMinutes >= 3 ? 'دقائق' : 'دقيقة'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
              {quote.technicianName} في طريقه من {trip.originCenter} إلى موقعك في{' '}
              {trip.destinationArea}
            </p>
          </div>
        </div>

        {/* Interactive Map Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setFocusArrival((prev) => !prev)}
            className="min-h-[40px] px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#FF5A00] dark:hover:border-orange-500 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            {focusArrival ? (
              <>
                <ZoomOut className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400" />
                <span>المسار الكامل</span>
              </>
            ) : (
              <>
                <ZoomIn className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400" />
                <span>تقريب الوصول</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleManualRefresh}
            className="min-h-[40px] px-3 py-1.5 text-xs font-semibold rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/60 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>
              {lastPingSecondsAgo === 0 ? 'محدّث الآن' : 'تحديث المسار'}
            </span>
          </button>
        </div>
      </div>

      {/* Symbolic Live Route Map Canvas */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-950">
        <svg
          viewBox={viewBox}
          className="w-full h-[195px] sm:h-[220px] block select-none transition-all duration-300"
          role="img"
          aria-label={`خريطة رمزية لمسار ${quote.technicianName} متبقي ${trip.remainingKm} كيلومتر والوصول خلال ${trip.etaMinutes} دقيقة`}
        >
          <rect x="0" y="0" width="640" height="230" fill={bgFill} />

          {/* Architectural Urban District Blocks & Grid */}
          <g stroke={gridStroke} strokeWidth="1">
            <line x1="0" y1="45" x2="640" y2="45" />
            <line x1="0" y1="95" x2="640" y2="95" />
            <line x1="0" y1="145" x2="640" y2="145" />
            <line x1="0" y1="195" x2="640" y2="195" />
            <line x1="90" y1="0" x2="90" y2="230" />
            <line x1="190" y1="0" x2="190" y2="230" />
            <line x1="300" y1="0" x2="300" y2="230" />
            <line x1="410" y1="0" x2="410" y2="230" />
            <line x1="520" y1="0" x2="520" y2="230" />
          </g>

          {/* Subtle Nile / Canal Symbolic Band in Dakahlia */}
          <path
            d="M 355 0 C 340 70, 382 145, 345 230"
            fill="none"
            stroke={waterStroke}
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Secondary Neighborhood Arterial Roads */}
          <g
            fill="none"
            stroke={roadSecondaryStroke}
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.65"
          >
            <path d="M 30 165 Q 170 110, 310 128 T 615 80" />
            <path d="M 145 22 Q 210 120, 175 215" />
            <path d="M 465 20 Q 485 110, 445 210" />
          </g>

          {/* Outer Road Casing under Active Route */}
          <path
            d={`M ${ROUTE_P0.x},${ROUTE_P0.y} C ${ROUTE_P1.x},${ROUTE_P1.y} ${ROUTE_P2.x},${ROUTE_P2.y} ${ROUTE_P3.x},${ROUTE_P3.y}`}
            fill="none"
            stroke={isDark ? '#1e293b' : '#e2e8f0'}
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Remaining Route (Dashed Ahead of Technician) */}
          <path
            d={remainingPath}
            fill="none"
            stroke={remainingStroke}
            strokeWidth="3.5"
            strokeDasharray="7 6"
            strokeLinecap="round"
          />

          {/* Traversed Active Route (Warm Talabat Orange) */}
          <path
            d={completedPath}
            fill="none"
            stroke={activeRouteStroke}
            strokeWidth="4.5"
            strokeLinecap="round"
          />

          {/* Mid-route Highway/Corridor Label */}
          <g transform={`translate(${midpointLandmark.x}, ${midpointLandmark.y + 24})`}>
            <rect
              x="-68"
              y="-11"
              width="136"
              height="20"
              rx="6"
              fill={cardSurface}
              stroke={gridStroke}
              strokeWidth="1"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill={subTextFill}
              fontSize="10"
              fontWeight="600"
            >
              {trip.corridorLabel}
            </text>
          </g>

          {/* Origin Waypoint: Technician Departure Hub */}
          <g transform={`translate(${ROUTE_P0.x}, ${ROUTE_P0.y})`}>
            <circle
              r="9"
              fill={cardSurface}
              stroke={activeRouteStroke}
              strokeWidth="3"
            />
            <circle r="3.5" fill={activeRouteStroke} />
            <rect
              x="-46"
              y="14"
              width="92"
              height="21"
              rx="6"
              fill={cardSurface}
              stroke={gridStroke}
              strokeWidth="1"
            />
            <text
              x="0"
              y="28"
              textAnchor="middle"
              fill={labelTextFill}
              fontSize="10"
              fontWeight="700"
            >
              انطلاق: {trip.originCenter}
            </text>
          </g>

          {/* Destination Waypoint: Customer Home */}
          <g transform={`translate(${ROUTE_P3.x}, ${ROUTE_P3.y})`}>
            <circle
              r="18"
              fill={isDark ? 'rgba(16, 185, 129, 0.20)' : 'rgba(16, 185, 129, 0.16)'}
            />
            <circle
              r="11"
              fill="#059669"
              stroke={cardSurface}
              strokeWidth="2.5"
            />
            {/* Minimal Home Icon inside SVG Pin */}
            <path
              d="M -4.5 1 L 0 -4 L 4.5 1 V 4.5 H 1.5 V 1.8 H -1.5 V 4.5 H -4.5 Z"
              fill="#ffffff"
            />
            <rect
              x="-52"
              y="-36"
              width="104"
              height="22"
              rx="7"
              fill="#059669"
            />
            <text
              x="0"
              y="-22"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="10.5"
              fontWeight="700"
            >
              موقعك ({trip.destinationCenter})
            </text>
          </g>

          {/* Live Moving Technician Marker */}
          <g transform={`translate(${techPos.x}, ${techPos.y})`}>
            <circle
              r="21"
              fill={isDark ? 'rgba(251, 146, 60, 0.22)' : 'rgba(255, 90, 0, 0.18)'}
            />
            <circle
              r="13.5"
              fill={activeRouteStroke}
              stroke={cardSurface}
              strokeWidth="2.5"
            />
            {/* Directional Navigation Arrow Rotated Along Route Tangent */}
            <g transform={`rotate(${techAngleDeg + 90})`}>
              <path
                d="M 0 -6 L 5 5 L 0 2.5 L -5 5 Z"
                fill="#ffffff"
              />
            </g>
          </g>

          {/* Dynamic Floating Live Distance & ETA Callout Above/Below Marker */}
          <g transform={`translate(${Math.min(545, Math.max(95, techPos.x))}, ${calloutY})`}>
            <rect
              x="-58"
              y="-13"
              width="116"
              height="24"
              rx="7"
              fill={isDark ? '#1e293b' : '#0f172a'}
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="10.5"
              fontWeight="700"
            >
              على بُعد {trip.remainingKm} كم · {trip.etaMinutes} د
            </text>
          </g>
        </svg>

        {/* Bottom Progress Hairline Strip inside Map Frame */}
        <div className="px-3.5 py-2 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400 shrink-0" />
            <span>نقطة الانطلاق: {trip.originCenter}</span>
          </span>

          <div className="flex-1 max-w-[200px] hidden sm:flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#FF5A00] dark:bg-orange-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-bold text-orange-700 dark:text-orange-400 tabular-nums">
              {progressPercent}%
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
            <Home className="w-3.5 h-3.5 shrink-0" />
            <span>الوصول: {trip.destinationArea}</span>
          </span>
        </div>
      </div>

      {/* Live Telemetry Metrics Row (Clean Hairline Columns, No Pills) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-slate-800/40">
        <div className="p-3.5 flex items-center justify-between sm:block space-y-0.5">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
            <Route className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400" />
            <span>المسافة المتبقية</span>
          </span>
          <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
            {trip.remainingKm} كم{' '}
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              من {trip.totalDistanceKm} كم
            </span>
          </div>
        </div>

        <div className="p-3.5 flex items-center justify-between sm:block space-y-0.5">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400" />
            <span>زمن الوصول التقديري</span>
          </span>
          <div className="text-base font-extrabold text-orange-700 dark:text-orange-400 tabular-nums">
            {trip.etaMinutes}{' '}
            {trip.etaMinutes <= 10 && trip.etaMinutes >= 3 ? 'دقائق' : 'دقيقة'}{' '}
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              (الساعة {trip.arrivalTimeLabel})
            </span>
          </div>
        </div>

        <div className="p-3.5 flex items-center justify-between sm:block space-y-0.5">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            حالة المسار والوجهة
          </span>
          <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 truncate">
            متجه إليك · {trip.corridorLabel}
          </div>
        </div>
      </div>
    </section>
  );
}
