import {
  APIProvider,
  AdvancedMarker,
  Map as GoogleMap,
  InfoWindow,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Home,
  LocateFixed,
  MapPin,
  Maximize2,
  MessageCircle,
  Navigation,
  Phone,
  RefreshCw,
  Route,
  UserCheck,
  Wrench,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DAKAHLIA_CENTER_COORDS, getLocationMeta, haversineKm } from '../data/dakahliaLocations';
import { ServiceQuote, ServiceRequest, Technician } from '../types/khadamat';

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

function resolveTripEndpoints(
  request: ServiceRequest,
  quote: ServiceQuote | undefined | null,
  technicians: Technician[]
): {
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
  originCenter: string;
  destinationCenter: string;
  destinationArea: string;
} {
  const customerLoc = getLocationMeta(request.district);
  const tech = technicians.find((t) => t.id === quote?.technicianId);
  const originCenter = tech?.primaryCenter || customerLoc.center || 'المنصورة';
  const baseTechCoords = DAKAHLIA_CENTER_COORDS[originCenter] || DAKAHLIA_CENTER_COORDS['المنصورة'];

  const fracA = deterministicFraction(`${request.id}-dest`);
  const fracB = deterministicFraction(`${request.id}-${quote?.technicianId || 'tech'}`);

  // Micro-offset customer pin inside target neighborhood so each order has distinct placement
  const destination: google.maps.LatLngLiteral = {
    lat: Number((customerLoc.lat + (fracA - 0.5) * 0.006).toFixed(6)),
    lng: Number((customerLoc.lng + (((fracA * 1.7) % 1) - 0.5) * 0.006).toFixed(6)),
  };

  // Ensure origin & destination always form a realistic street-level route even within the same center
  const sameCenter =
    Math.abs(baseTechCoords.lat - destination.lat) < 0.006 &&
    Math.abs(baseTechCoords.lng - destination.lng) < 0.006;

  const angle = fracB * Math.PI * 2;
  const origin: google.maps.LatLngLiteral = sameCenter
    ? {
        lat: Number((destination.lat + Math.sin(angle) * 0.022).toFixed(6)),
        lng: Number((destination.lng + Math.cos(angle) * 0.025).toFixed(6)),
      }
    : {
        lat: Number((baseTechCoords.lat + (fracB - 0.5) * 0.005).toFixed(6)),
        lng: Number((baseTechCoords.lng + (((fracB * 1.3) % 1) - 0.5) * 0.005).toFixed(6)),
      };

  return {
    origin,
    destination,
    originCenter,
    destinationCenter: customerLoc.center,
    destinationArea: customerLoc.areaName,
  };
}

export function computeLiveTripMetrics(
  request: ServiceRequest,
  quote?: ServiceQuote | null,
  technicians: Technician[] = [],
  nowMs: number = Date.now(),
  fallbackAnchorMs?: number
): LiveTripMetrics {
  const endpoints = resolveTripEndpoints(request, quote, technicians);
  const rawKm = haversineKm(
    endpoints.origin.lat,
    endpoints.origin.lng,
    endpoints.destination.lat,
    endpoints.destination.lng
  );

  const jitter = deterministicFraction(request.id);
  const totalDistanceKm =
    rawKm < 3
      ? Number((3.6 + jitter * 1.9).toFixed(1))
      : Number(Math.min(24, Math.max(3.8, rawKm * 1.15)).toFixed(1));

  const corridorLabel =
    endpoints.originCenter === endpoints.destinationCenter
      ? `محور ${endpoints.destinationCenter} الداخلي`
      : `طريق ${endpoints.originCenter} – ${endpoints.destinationCenter}`;

  if (request.status === 'in_progress' || request.status === 'completed') {
    return {
      originCenter: endpoints.originCenter,
      destinationCenter: endpoints.destinationCenter,
      destinationArea: endpoints.destinationArea,
      totalDistanceKm,
      remainingKm: 0,
      etaMinutes: 0,
      arrivalTimeLabel: 'وصل للموقع',
      progress: 1,
      corridorLabel,
    };
  }

  const startedAt = request.enRouteStartedAt ?? fallbackAnchorMs ?? nowMs - 2 * 60 * 1000;
  const elapsedSeconds = Math.max(0, (nowMs - startedAt) / 1000);
  const expectedTripSeconds = Math.max(240, Math.round(totalDistanceKm * 135));
  const rawProgress = 0.22 + (elapsedSeconds / expectedTripSeconds) * 0.72;
  const progress = Math.min(0.94, Math.max(0.22, rawProgress));

  const remainingKm = Math.max(0.2, Number((totalDistanceKm * (1 - progress)).toFixed(1)));
  const etaMinutes = Math.max(1, Math.ceil(remainingKm * 2.4));

  const arrivalDate = new Date(nowMs + etaMinutes * 60 * 1000);
  const hours24 = arrivalDate.getHours();
  const minutes = arrivalDate.getMinutes().toString().padStart(2, '0');
  const period = hours24 >= 12 ? 'م' : 'ص';
  const hours12 = (hours24 % 12 || 12).toString();
  const arrivalTimeLabel = `${hours12}:${minutes} ${period}`;

  return {
    originCenter: endpoints.originCenter,
    destinationCenter: endpoints.destinationCenter,
    destinationArea: endpoints.destinationArea,
    totalDistanceKm,
    remainingKm,
    etaMinutes,
    arrivalTimeLabel,
    progress,
    corridorLabel,
  };
}

function buildCurvedFallbackPath(
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral,
  steps = 28
): google.maps.LatLngLiteral[] {
  const midLat = (origin.lat + destination.lat) / 2;
  const midLng = (origin.lng + destination.lng) / 2;
  const dLat = destination.lat - origin.lat;
  const dLng = destination.lng - origin.lng;
  // Perpendicular slight road bend
  const ctrl = {
    lat: midLat - dLng * 0.14,
    lng: midLng + dLat * 0.14,
  };

  const pts: google.maps.LatLngLiteral[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const u = 1 - t;
    pts.push({
      lat: u * u * origin.lat + 2 * u * t * ctrl.lat + t * t * destination.lat,
      lng: u * u * origin.lng + 2 * u * t * ctrl.lng + t * t * destination.lng,
    });
  }
  return pts;
}

function samplePathAtProgress(
  path: google.maps.LatLngLiteral[],
  progress: number
): {
  position: google.maps.LatLngLiteral;
  traversedPath: google.maps.LatLngLiteral[];
} {
  if (path.length === 0) {
    return { position: { lat: 31.0409, lng: 31.3785 }, traversedPath: [] };
  }
  if (path.length === 1 || progress <= 0) {
    return { position: path[0], traversedPath: [path[0]] };
  }
  if (progress >= 1) {
    return { position: path[path.length - 1], traversedPath: path };
  }

  let totalLen = 0;
  const segLens: number[] = [];
  for (let i = 0; i < path.length - 1; i += 1) {
    const dLat = path[i + 1].lat - path[i].lat;
    const dLng = path[i + 1].lng - path[i].lng;
    const len = Math.hypot(dLat, dLng);
    segLens.push(len);
    totalLen += len;
  }

  if (totalLen === 0) {
    return { position: path[0], traversedPath: [path[0]] };
  }

  const targetDist = totalLen * progress;
  let acc = 0;
  const traversedPath: google.maps.LatLngLiteral[] = [path[0]];

  for (let i = 0; i < segLens.length; i += 1) {
    const segLen = segLens[i];
    if (acc + segLen >= targetDist) {
      const localT = segLen > 0 ? (targetDist - acc) / segLen : 0;
      const interp: google.maps.LatLngLiteral = {
        lat: path[i].lat + (path[i + 1].lat - path[i].lat) * localT,
        lng: path[i].lng + (path[i + 1].lng - path[i].lng) * localT,
      };
      traversedPath.push(interp);
      return { position: interp, traversedPath };
    }
    acc += segLen;
    traversedPath.push(path[i + 1]);
  }

  return { position: path[path.length - 1], traversedPath: path };
}

type FocusMode = 'full' | 'tech' | 'customer';

interface RouteLayerProps {
  request: ServiceRequest;
  quote: ServiceQuote;
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
  originCenter: string;
  destinationArea: string;
  progress: number;
  remainingKm: number;
  etaMinutes: number;
  focusMode: FocusMode;
  refreshTick: number;
  isDark: boolean;
  techPhone: string;
  onRealRouteMetrics: (metrics: { distanceKm: number; durationMinutes: number } | null) => void;
}

function RouteAndMarkersLayer({
  request,
  quote,
  origin,
  destination,
  originCenter,
  destinationArea,
  progress,
  remainingKm,
  etaMinutes,
  focusMode,
  refreshTick,
  isDark,
  techPhone,
  onRealRouteMetrics,
}: RouteLayerProps) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const isInProgress = request.status === 'in_progress';

  const fallbackPath = useMemo(
    () => buildCurvedFallbackPath(origin, destination),
    [origin, destination]
  );

  const [computedPath, setComputedPath] = useState<google.maps.LatLngLiteral[] | null>(null);
  const [activeInfo, setActiveInfo] = useState<'tech' | 'customer' | null>(null);

  const basePolylinesRef = useRef<google.maps.Polyline[]>([]);
  const activePolylineRef = useRef<google.maps.Polyline | null>(null);
  const viewportBoundsRef = useRef<google.maps.LatLngBounds | null>(null);

  const [techMarkerRef, techMarker] = useAdvancedMarkerRef();
  const [customerMarkerRef, customerMarker] = useAdvancedMarkerRef();

  // Compute driving route via modern Maps JS SDK `Route.computeRoutes()` (bypasses CORS, zero legacy DirectionsService)
  useEffect(() => {
    if (!map || !routesLib) return;

    let cancelled = false;

    basePolylinesRef.current.forEach((p) => p.setMap(null));
    basePolylinesRef.current = [];

    const routeClass = (
      routesLib as unknown as {
        Route?: {
          computeRoutes: (req: Record<string, unknown>) => Promise<{ routes?: unknown[] }>;
        };
      }
    ).Route;

    if (!routeClass?.computeRoutes) {
      setComputedPath(fallbackPath);
      onRealRouteMetrics(null);
      return;
    }

    routeClass
      .computeRoutes({
        origin,
        destination,
        travelMode: 'DRIVING',
        fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
      })
      .then((res) => {
        if (cancelled) return;
        const primaryRoute = res?.routes?.[0] as
          | {
              path?: google.maps.LatLng[];
              distanceMeters?: number;
              durationMillis?: number;
              viewport?: google.maps.LatLngBounds;
              createPolylines?: () => google.maps.Polyline[];
            }
          | undefined;

        if (!primaryRoute) {
          setComputedPath(fallbackPath);
          onRealRouteMetrics(null);
          return;
        }

        const rawPoints: google.maps.LatLngLiteral[] = (primaryRoute.path || []).map((pt) => ({
          lat: typeof pt.lat === 'function' ? pt.lat() : (pt as unknown as number),
          lng: typeof pt.lng === 'function' ? pt.lng() : (pt as unknown as number),
        }));

        const resolvedPath = rawPoints.length >= 2 ? rawPoints : fallbackPath;
        setComputedPath(resolvedPath);

        if (typeof primaryRoute.createPolylines === 'function') {
          const sdkPolylines = primaryRoute.createPolylines();
          sdkPolylines.forEach((pl) => {
            pl.setOptions({
              strokeColor: isInProgress
                ? isDark
                  ? '#34d399'
                  : '#059669'
                : isDark
                  ? '#475569'
                  : '#94a3b8',
              strokeOpacity: isInProgress ? 0.5 : 0.72,
              strokeWeight: 5,
            });
            pl.setMap(map);
          });
          basePolylinesRef.current = sdkPolylines;
        }

        if (primaryRoute.distanceMeters && primaryRoute.durationMillis) {
          onRealRouteMetrics({
            distanceKm: Math.max(0.5, Number((primaryRoute.distanceMeters / 1000).toFixed(1))),
            durationMinutes: Math.max(1, Math.ceil(primaryRoute.durationMillis / 60000)),
          });
        }

        if (primaryRoute.viewport) {
          viewportBoundsRef.current = primaryRoute.viewport;
          if (focusMode === 'full') {
            map.fitBounds(primaryRoute.viewport, {
              top: 44,
              bottom: 44,
              left: 36,
              right: 36,
            });
          }
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('OVER_QUERY_LIMIT') ||
          msg.includes('429') ||
          msg.includes('QuotaExceededError')
        ) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        setComputedPath(fallbackPath);
        onRealRouteMetrics(null);
      });

    return () => {
      cancelled = true;
      basePolylinesRef.current.forEach((p) => p.setMap(null));
      basePolylinesRef.current = [];
    };
  }, [
    map,
    routesLib,
    origin,
    destination,
    refreshTick,
    isDark,
    isInProgress,
    fallbackPath,
    focusMode,
    onRealRouteMetrics,
  ]);

  const activePathPoints = computedPath ?? fallbackPath;
  const effectiveProgress = isInProgress ? 1 : progress;

  const { position: sampledTechPos, traversedPath } = useMemo(
    () => samplePathAtProgress(activePathPoints, effectiveProgress),
    [activePathPoints, effectiveProgress]
  );

  // When working in-progress at customer site, apply tiny ~30m lateral separation so both pins are clearly distinct
  const techPosition: google.maps.LatLngLiteral = useMemo(
    () =>
      isInProgress
        ? {
            lat: destination.lat + 0.00026,
            lng: destination.lng + 0.00028,
          }
        : sampledTechPos,
    [isInProgress, destination, sampledTechPos]
  );

  // Draw highlighted traversed route segment (and fallback dashed remaining path if SDK polyline unavailable)
  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps?.Polyline) return;

    if (activePolylineRef.current) {
      activePolylineRef.current.setMap(null);
      activePolylineRef.current = null;
    }

    // If basePolylinesRef is empty (fallback mode), draw base remaining line first inside the active layer
    if (basePolylinesRef.current.length === 0 && activePathPoints.length >= 2) {
      const baseFallback = new google.maps.Polyline({
        path: activePathPoints,
        geodesic: true,
        strokeColor: isDark ? '#475569' : '#94a3b8',
        strokeOpacity: 0.7,
        strokeWeight: 4,
        map,
      });
      basePolylinesRef.current = [baseFallback];
    }

    if (traversedPath.length >= 2) {
      const traversedLine = new google.maps.Polyline({
        path: traversedPath,
        geodesic: true,
        strokeColor: isInProgress
          ? isDark
            ? '#10b981'
            : '#059669'
          : isDark
            ? '#fb923c'
            : '#FF5A00',
        strokeOpacity: 0.95,
        strokeWeight: 5.5,
        zIndex: 12,
        map,
      });
      activePolylineRef.current = traversedLine;
    }

    return () => {
      if (activePolylineRef.current) {
        activePolylineRef.current.setMap(null);
        activePolylineRef.current = null;
      }
    };
  }, [map, traversedPath, activePathPoints, isDark, isInProgress]);

  // Camera control syncing
  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps?.LatLngBounds) return;

    if (focusMode === 'tech') {
      map.panTo(techPosition);
      map.setZoom(15);
      return;
    }

    if (focusMode === 'customer') {
      map.panTo(destination);
      map.setZoom(15);
      return;
    }

    if (isInProgress) {
      const closeBounds = new google.maps.LatLngBounds();
      closeBounds.extend(destination);
      closeBounds.extend(techPosition);
      map.fitBounds(closeBounds, { top: 64, bottom: 64, left: 64, right: 64 });
      const currentZoom = map.getZoom();
      if (currentZoom && currentZoom > 16) {
        map.setZoom(16);
      }
      return;
    }

    if (viewportBoundsRef.current) {
      map.fitBounds(viewportBoundsRef.current, {
        top: 44,
        bottom: 44,
        left: 36,
        right: 36,
      });
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(origin);
    bounds.extend(destination);
    bounds.extend(techPosition);
    map.fitBounds(bounds, { top: 48, bottom: 48, left: 40, right: 40 });
  }, [map, focusMode, isInProgress, origin, destination, techPosition, refreshTick]);

  const cleanWaDigits = techPhone.replace(/[^\d]/g, '').replace(/^0/, '20');
  const waHref = `https://wa.me/${cleanWaDigits}?text=${encodeURIComponent(
    `مرحباً ${quote.technicianName}، أتابع معك طلب #${request.referenceCode} (${request.serviceTitle})`
  )}`;

  return (
    <>
      {/* Technician Origin Hub Pin (shown while en route) */}
      {!isInProgress && (
        <AdvancedMarker
          position={origin}
          title={`انطلاق: ${originCenter}`}
          anchorLeft="-50%"
          anchorTop="-50%"
        >
          <div className="flex flex-col items-center pointer-events-none select-none">
            <div className="w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-[3px] border-[#FF5A00] shadow-md" />
            <span className="mt-1 px-2 py-0.5 rounded-md bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-200 shadow-sm whitespace-nowrap">
              انطلاق: {originCenter}
            </span>
          </div>
        </AdvancedMarker>
      )}

      {/* Customer Home Pin */}
      <AdvancedMarker
        ref={customerMarkerRef}
        position={destination}
        clickable
        onClick={() => setActiveInfo((prev) => (prev === 'customer' ? null : 'customer'))}
        title={`موقع العميل (${destinationArea})`}
        anchorLeft="-50%"
        anchorTop="-85%"
      >
        <div className="flex flex-col items-center cursor-pointer select-none group">
          <span className="mb-1 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-extrabold shadow-md whitespace-nowrap">
            موقعك · {destinationArea}
          </span>
          <div className="w-9 h-9 rounded-full bg-emerald-600 text-white border-2 border-white dark:border-slate-900 shadow-lg flex items-center justify-center ring-4 ring-emerald-500/25 group-hover:scale-105 transition-transform">
            <Home className="w-4 h-4" />
          </div>
        </div>
      </AdvancedMarker>

      {/* Live Technician Marker */}
      <AdvancedMarker
        ref={techMarkerRef}
        position={techPosition}
        clickable
        onClick={() => setActiveInfo((prev) => (prev === 'tech' ? null : 'tech'))}
        title={quote.technicianName}
        anchorLeft="-50%"
        anchorTop="-85%"
        zIndex={30}
      >
        <div className="flex flex-col items-center cursor-pointer select-none group">
          <span
            className={`mb-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold shadow-md whitespace-nowrap text-white ${
              isInProgress
                ? 'bg-amber-600 dark:bg-amber-500'
                : 'bg-slate-900 dark:bg-slate-800 border border-orange-400/50'
            }`}
          >
            {isInProgress
              ? `${quote.technicianName} · بدأ العمل`
              : `${quote.technicianName} · ${remainingKm} كم (${etaMinutes} د)`}
          </span>
          <div
            className={`w-10 h-10 rounded-full text-white border-2 border-white dark:border-slate-900 shadow-lg flex items-center justify-center transition-transform group-hover:scale-105 ${
              isInProgress
                ? 'bg-amber-600 ring-4 ring-amber-500/30'
                : 'bg-[#FF5A00] ring-4 ring-orange-500/35'
            }`}
          >
            {isInProgress ? <Wrench className="w-4 h-4" /> : <Navigation className="w-4 h-4" />}
          </div>
        </div>
      </AdvancedMarker>

      {/* Interactive InfoWindow for Customer Pin */}
      {activeInfo === 'customer' && customerMarker && (
        <InfoWindow anchor={customerMarker} maxWidth={250} onCloseClick={() => setActiveInfo(null)}>
          <div dir="rtl" className="p-1 text-right space-y-1 text-slate-900">
            <div className="text-xs font-extrabold text-emerald-700 flex items-center gap-1">
              <Home className="w-3.5 h-3.5 shrink-0" />
              <span>موقع تنفيذ الخدمة</span>
            </div>
            <div className="text-xs font-bold">{destinationArea}</div>
            {request.addressText && (
              <div className="text-[11px] text-slate-600 leading-snug">{request.addressText}</div>
            )}
            <div className="text-[10px] font-semibold text-slate-500 pt-0.5">
              طلب #{request.referenceCode}
            </div>
          </div>
        </InfoWindow>
      )}

      {/* Interactive InfoWindow for Technician Pin */}
      {activeInfo === 'tech' && techMarker && (
        <InfoWindow anchor={techMarker} maxWidth={270} onCloseClick={() => setActiveInfo(null)}>
          <div dir="rtl" className="p-1 text-right space-y-2 text-slate-900">
            <div className="space-y-0.5">
              <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-[#FF5A00] shrink-0" />
                <span>{quote.technicianName}</span>
              </div>
              <div className="text-[11px] font-semibold text-orange-700">
                {isInProgress
                  ? 'وصل إلى الموقع وبدأ العمل الآن'
                  : `في الطريق من ${originCenter} · متبقي ${remainingKm} كم (${etaMinutes} د)`}
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-0.5">
              <a
                href={`tel:${techPhone}`}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-bold hover:bg-slate-800"
              >
                <Phone className="w-3 h-3" />
                <span>اتصال</span>
              </a>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FF5A00] text-white text-[11px] font-bold hover:bg-orange-700"
              >
                <MessageCircle className="w-3 h-3" />
                <span>واتساب</span>
              </a>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

interface InnerMapCanvasProps {
  request: ServiceRequest;
  quote: ServiceQuote;
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
  originCenter: string;
  destinationArea: string;
  progress: number;
  remainingKm: number;
  etaMinutes: number;
  focusMode: FocusMode;
  refreshTick: number;
  isDark: boolean;
  techPhone: string;
  onRealRouteMetrics: (metrics: { distanceKm: number; durationMinutes: number } | null) => void;
}

function MapsStatusCanvas(props: InnerMapCanvasProps) {
  const apiStatus = useApiLoadingStatus();
  const isInProgress = props.request.status === 'in_progress';
  const mapCenter = useMemo(() => {
    if (isInProgress) return props.destination;
    return {
      lat: (props.origin.lat + props.destination.lat) / 2,
      lng: (props.origin.lng + props.destination.lng) / 2,
    };
  }, [isInProgress, props.origin, props.destination]);

  const externalDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${props.origin.lat},${props.origin.lng}&destination=${props.destination.lat},${props.destination.lng}&travelmode=driving`;

  if (apiStatus === 'FAILED' || apiStatus === 'AUTH_FAILURE') {
    return (
      <div className="h-[260px] sm:h-[300px] flex flex-col items-center justify-center gap-3 p-5 text-center bg-slate-50 dark:bg-slate-950">
        <div className="w-11 h-11 rounded-2xl bg-orange-100 dark:bg-orange-950/80 text-[#FF5A00] flex items-center justify-center">
          <MapPin className="w-5 h-5" />
        </div>
        <div className="space-y-1 max-w-sm">
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
            تعذّر تحميل الخريطة التفاعلية حالياً
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            تحقق من اتصال الشبكة أو صلاحيات مفتاح الخريطة. يمكنك متابعة المسار المباشر بين{' '}
            {props.originCenter} و{props.destinationArea} عبر الرابط التالي:
          </p>
        </div>
        <a
          href={externalDirectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[40px] px-4 py-2 rounded-xl bg-[#FF5A00] hover:bg-orange-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
        >
          <span>فتح المسار في خرائط جوجل</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[270px] sm:h-[310px]">
      {apiStatus === 'LOADING' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-[1px]">
          <div className="w-7 h-7 rounded-full border-2 border-[#FF5A00] border-t-transparent animate-spin" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            جاري تحميل الخريطة ومسار الفني...
          </span>
        </div>
      )}

      <GoogleMap
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        defaultCenter={mapCenter}
        defaultZoom={isInProgress ? 15 : 13}
        gestureHandling="greedy"
        streetViewControl={false}
        mapTypeControl={false}
        fullscreenControl
        zoomControl
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      >
        <RouteAndMarkersLayer {...props} />
      </GoogleMap>
    </div>
  );
}

interface LiveTechnicianRouteMapProps {
  request: ServiceRequest;
  quote: ServiceQuote;
  technicians?: Technician[];
  isDark?: boolean;
  viewerRole?: 'customer' | 'technician';
}

export function LiveTechnicianRouteMap({
  request,
  quote,
  technicians = [],
  isDark = false,
  viewerRole = 'customer',
}: LiveTechnicianRouteMapProps) {
  const [fallbackAnchorMs] = useState<number>(() => Date.now() - 2 * 60 * 1000);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [focusMode, setFocusMode] = useState<FocusMode>('full');
  const [refreshTick, setRefreshTick] = useState(0);
  const [lastPingSecondsAgo, setLastPingSecondsAgo] = useState(0);
  const [realRouteMetrics, setRealRouteMetrics] = useState<{
    distanceKm: number;
    durationMinutes: number;
  } | null>(null);

  const isInProgress = request.status === 'in_progress';

  // Live 2-second ticker when en_route so technician marker glides smoothly along route
  useEffect(() => {
    if (isInProgress) return;
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
      setLastPingSecondsAgo((prev) => (prev + 2) % 60);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [isInProgress]);

  const endpoints = useMemo(
    () => resolveTripEndpoints(request, quote, technicians),
    [request, quote, technicians]
  );

  const baseTrip = useMemo(
    () => computeLiveTripMetrics(request, quote, technicians, nowMs, fallbackAnchorMs),
    [request, quote, technicians, nowMs, fallbackAnchorMs]
  );

  const effectiveTotalKm = realRouteMetrics?.distanceKm ?? baseTrip.totalDistanceKm;
  const remainingKm = isInProgress
    ? 0
    : Math.max(0.2, Number((effectiveTotalKm * (1 - baseTrip.progress)).toFixed(1)));
  const etaMinutes = isInProgress
    ? 0
    : realRouteMetrics
      ? Math.max(1, Math.ceil(realRouteMetrics.durationMinutes * (1 - baseTrip.progress)))
      : baseTrip.etaMinutes;

  const techProfile = technicians.find((t) => t.id === quote.technicianId);
  const techPhone = techProfile?.phone || '01012345678';

  const mapsApiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || '';

  const handleManualRefresh = () => {
    setNowMs(Date.now());
    setLastPingSecondsAgo(0);
    setRefreshTick((prev) => prev + 1);
  };

  const handleRealRouteMetrics = useCallback(
    (metrics: { distanceKm: number; durationMinutes: number } | null) => {
      setRealRouteMetrics(metrics);
    },
    []
  );

  const progressPercent = isInProgress ? 100 : Math.round(baseTrip.progress * 100);
  const externalDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${endpoints.origin.lat},${endpoints.origin.lng}&destination=${endpoints.destination.lat},${endpoints.destination.lng}&travelmode=driving`;

  return (
    <section
      aria-label="خريطة تتبع الفني الحقيقية"
      className={`bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-5 space-y-3.5 border ${
        isInProgress
          ? 'border-amber-200 dark:border-amber-800/80'
          : 'border-orange-200 dark:border-orange-800/80'
      }`}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 ${
              isInProgress ? 'bg-amber-600 dark:bg-amber-500' : 'bg-[#FF5A00] dark:bg-orange-600'
            }`}
          >
            {isInProgress ? (
              <Wrench className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Navigation className="w-5 h-5" aria-hidden="true" />
            )}
          </div>

          <div className="min-w-0 space-y-0.5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                {isInProgress ? 'الفني في الموقع · بدأ العمل' : 'خريطة مسار الفني المباشر'}
              </h3>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                ·
              </span>
              {isInProgress ? (
                <span className="font-bold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تم الوصول إلى {endpoints.destinationArea}</span>
                </span>
              ) : (
                <span className="font-bold text-orange-700 dark:text-orange-400 tabular-nums">
                  متبقي {remainingKm} كم · الوصول خلال {etaMinutes}{' '}
                  {etaMinutes <= 10 && etaMinutes >= 3 ? 'دقائق' : 'دقيقة'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
              {viewerRole === 'technician'
                ? isInProgress
                  ? `موقع تنفيذ خدمة «${request.serviceTitle}» في ${endpoints.destinationArea}`
                  : `مسارك إلى موقع العميل في ${endpoints.destinationArea}`
                : isInProgress
                  ? `${quote.technicianName} متواجد الآن في موقعك وينفذ «${request.serviceTitle}»`
                  : `${quote.technicianName} في طريقه من ${endpoints.originCenter} إلى موقعك في ${endpoints.destinationArea}`}
            </p>
          </div>
        </div>

        {/* Interactive Camera Focus & Refresh Controls */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setFocusMode('full')}
            className={`min-h-[38px] px-2.5 py-1.5 text-[11px] font-bold rounded-xl border inline-flex items-center gap-1 transition-colors cursor-pointer ${
              focusMode === 'full'
                ? 'border-[#FF5A00] bg-orange-50 dark:bg-orange-950/60 text-[#FF5A00] dark:text-orange-400'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>المسار الكامل</span>
          </button>

          <button
            type="button"
            onClick={() => setFocusMode('tech')}
            className={`min-h-[38px] px-2.5 py-1.5 text-[11px] font-bold rounded-xl border inline-flex items-center gap-1 transition-colors cursor-pointer ${
              focusMode === 'tech'
                ? 'border-[#FF5A00] bg-orange-50 dark:bg-orange-950/60 text-[#FF5A00] dark:text-orange-400'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
          >
            <LocateFixed className="w-3.5 h-3.5" />
            <span>موقع الفني</span>
          </button>

          <button
            type="button"
            onClick={() => setFocusMode('customer')}
            className={`min-h-[38px] px-2.5 py-1.5 text-[11px] font-bold rounded-xl border inline-flex items-center gap-1 transition-colors cursor-pointer ${
              focusMode === 'customer'
                ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>موقع العميل</span>
          </button>

          <button
            type="button"
            onClick={handleManualRefresh}
            className="min-h-[38px] px-2.5 py-1.5 text-[11px] font-bold rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/60 inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{lastPingSecondsAgo === 0 && !isInProgress ? 'محدّث' : 'تحديث'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Google Map Viewport */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-950">
        {mapsApiKey ? (
          <APIProvider
            apiKey={mapsApiKey}
            language="ar"
            region="EG"
            libraries={['routes', 'marker']}
          >
            <MapsStatusCanvas
              request={request}
              quote={quote}
              origin={endpoints.origin}
              destination={endpoints.destination}
              originCenter={endpoints.originCenter}
              destinationArea={endpoints.destinationArea}
              progress={baseTrip.progress}
              remainingKm={remainingKm}
              etaMinutes={etaMinutes}
              focusMode={focusMode}
              refreshTick={refreshTick}
              isDark={isDark}
              techPhone={techPhone}
              onRealRouteMetrics={handleRealRouteMetrics}
            />
          </APIProvider>
        ) : (
          <div className="h-[240px] flex flex-col items-center justify-center gap-3 p-5 text-center bg-slate-50 dark:bg-slate-950">
            <div className="w-11 h-11 rounded-2xl bg-orange-100 dark:bg-orange-950/80 text-[#FF5A00] flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="space-y-1 max-w-sm">
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                مفتاح خرائط جوجل غير مفعّل في البيئة الحالية
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                يمكنك متابعة مسار الفني مباشرة بين {endpoints.originCenter} و
                {endpoints.destinationArea}.
              </p>
            </div>
            <a
              href={externalDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#FF5A00] hover:bg-orange-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <span>عرض المسار في خرائط جوجل</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Bottom Progress Hairline Strip inside Map Frame */}
        <div className="px-3.5 py-2 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 truncate">
            <MapPin className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400 shrink-0" />
            <span className="truncate">انطلاق: {endpoints.originCenter}</span>
          </span>

          <div className="flex-1 max-w-[200px] hidden sm:flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isInProgress
                    ? 'bg-emerald-600 dark:bg-emerald-500'
                    : 'bg-[#FF5A00] dark:bg-orange-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span
              className={`font-bold tabular-nums ${
                isInProgress
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-orange-700 dark:text-orange-400'
              }`}
            >
              {progressPercent}%
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400 truncate">
            <Home className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">الموقع: {endpoints.destinationArea}</span>
          </span>
        </div>
      </div>

      {/* Live Telemetry Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-slate-800/40">
        <div className="p-3.5 flex items-center justify-between sm:block space-y-0.5">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
            <Route className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400" />
            <span>{isInProgress ? 'إجمالي مسافة الرحلة' : 'المسافة المتبقية'}</span>
          </span>
          <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
            {isInProgress ? (
              <>
                {effectiveTotalKm} كم{' '}
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  (تم الوصول)
                </span>
              </>
            ) : (
              <>
                {remainingKm} كم{' '}
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  من {effectiveTotalKm} كم
                </span>
              </>
            )}
          </div>
        </div>

        <div className="p-3.5 flex items-center justify-between sm:block space-y-0.5">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400" />
            <span>{isInProgress ? 'وضع التواجد الحالي' : 'زمن الوصول التقديري'}</span>
          </span>
          {isInProgress ? (
            <div className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
              في الموقع الآن
            </div>
          ) : (
            <div className="text-base font-extrabold text-orange-700 dark:text-orange-400 tabular-nums">
              {etaMinutes} {etaMinutes <= 10 && etaMinutes >= 3 ? 'دقائق' : 'دقيقة'}{' '}
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                (الساعة {baseTrip.arrivalTimeLabel})
              </span>
            </div>
          )}
        </div>

        <div className="p-3.5 flex items-center justify-between sm:block space-y-0.5">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            المسار والوجهة
          </span>
          <div
            className={`text-sm font-bold truncate ${
              isInProgress
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-emerald-700 dark:text-emerald-400'
            }`}
          >
            {isInProgress
              ? `قيد التنفيذ · ${endpoints.destinationArea}`
              : `متجه إليك · ${baseTrip.corridorLabel}`}
          </div>
        </div>
      </div>
    </section>
  );
}
