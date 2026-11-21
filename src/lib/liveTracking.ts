import { useEffect, useRef, useState } from 'react';
import { getLocationMeta, haversineKm } from '../data/dakahliaLocations';
import type { ServiceRequest } from '../types/khadamat';
import type { LiveTripMetrics } from '../components/LiveTechnicianRouteMap';
import { onRealtime, sendRealtime } from './realtime';

export interface LiveLocation {
  requestId: string;
  lat: number;
  lng: number;
  heading?: number;
  accuracy?: number;
  ts: number;
  startLat?: number;
  startLng?: number;
}

const FRESH_MS = 90_000;
const ROAD_FACTOR = 1.15;

export function isLiveFresh(live: LiveLocation | undefined, now = Date.now()): live is LiveLocation {
  return !!live && now - live.ts < FRESH_MS;
}

function arrivalLabel(nowMs: number, etaMinutes: number) {
  const d = new Date(nowMs + etaMinutes * 60_000);
  const h = d.getHours();
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h >= 12 ? 'م' : 'ص'}`;
}

/** يستبدل المحاكاة بالمسافة الحقيقية من موقع GPS للفني إلى العميل. */
export function applyLiveLocation(
  trip: LiveTripMetrics,
  live: LiveLocation | undefined,
  request: Pick<ServiceRequest, 'district' | 'customerLat' | 'customerLng'>,
  nowMs = Date.now()
): LiveTripMetrics & { isLive: boolean } {
  if (!isLiveFresh(live, nowMs)) return { ...trip, isLive: false };
  const meta = getLocationMeta(request.district);
  const dest =
    request.customerLat != null && request.customerLng != null
      ? { lat: request.customerLat, lng: request.customerLng }
      : { lat: meta.lat, lng: meta.lng };
  const remaining = Number((haversineKm(live.lat, live.lng, dest.lat, dest.lng) * ROAD_FACTOR).toFixed(1));
  const startKm =
    live.startLat != null && live.startLng != null
      ? haversineKm(live.startLat, live.startLng, dest.lat, dest.lng) * ROAD_FACTOR
      : trip.totalDistanceKm;
  const total = Number(Math.max(startKm, remaining, 0.1).toFixed(1));
  const progress = Math.min(0.98, Math.max(0.03, 1 - remaining / total));
  const etaMinutes = Math.max(1, Math.ceil(remaining * 2.4));
  return {
    ...trip,
    totalDistanceKm: total,
    remainingKm: remaining,
    progress,
    etaMinutes,
    arrivalTimeLabel: arrivalLabel(nowMs, etaMinutes),
    isLive: true,
  };
}

/** العميل/الإدارة: استقبال مواقع الفنيين الحية */
export function useLiveLocations(): Record<string, LiveLocation> {
  const [locs, setLocs] = useState<Record<string, LiveLocation>>({});
  useEffect(
    () =>
      onRealtime((msg) => {
        if (msg.type === 'snapshot' && msg.locations) setLocs(msg.locations);
        else if (msg.type === 'location') setLocs((p) => ({ ...p, [msg.location.requestId]: msg.location }));
        else if (msg.type === 'location_end')
          setLocs((p) => {
            const { [msg.requestId]: _gone, ...rest } = p;
            return rest;
          });
      }),
    []
  );
  return locs;
}

export type GpsStatus = 'idle' | 'sharing' | 'denied' | 'unsupported';

/** الفني: مشاركة الموقع الحقيقي طوال وجود مشوار «في الطريق». */
export function useTechnicianGps(requestIds: string[]): GpsStatus {
  const [status, setStatus] = useState<GpsStatus>('idle');
  const starts = useRef<Record<string, { lat: number; lng: number }>>({});
  const lastSent = useRef(0);
  const prevIds = useRef<string[]>([]);
  const key = requestIds.join('|');

  useEffect(() => {
    prevIds.current
      .filter((id) => !requestIds.includes(id))
      .forEach((id) => {
        sendRealtime({ type: 'location_end', requestId: id });
        delete starts.current[id];
      });
    prevIds.current = requestIds;

    if (requestIds.length === 0) {
      setStatus('idle');
      return;
    }
    if (!('geolocation' in navigator)) {
      setStatus('unsupported');
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setStatus('sharing');
        const now = Date.now();
        if (now - lastSent.current < 4000) return;
        lastSent.current = now;
        const { latitude: lat, longitude: lng, heading, accuracy } = pos.coords;
        requestIds.forEach((requestId) => {
          starts.current[requestId] ??= { lat, lng };
          sendRealtime({
            type: 'location',
            location: {
              requestId,
              lat,
              lng,
              heading: heading ?? undefined,
              accuracy,
              ts: now,
              startLat: starts.current[requestId].lat,
              startLng: starts.current[requestId].lng,
            } satisfies LiveLocation,
          });
        });
      },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'idle'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return status;
}
