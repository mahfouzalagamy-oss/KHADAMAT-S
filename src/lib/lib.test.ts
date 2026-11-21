import { describe, expect, it } from 'vitest';
import { mergeById } from './mergeById';
import { getRequestsTabForStatus } from './requestFlow';
import { applyLiveLocation, isLiveFresh, type LiveLocation } from './liveTracking';
import type { LiveTripMetrics } from '../components/LiveTechnicianRouteMap';

const baseTrip: LiveTripMetrics = {
  originCenter: 'المنصورة',
  destinationCenter: 'المنصورة',
  destinationArea: '',
  totalDistanceKm: 10,
  remainingKm: 8,
  etaMinutes: 20,
  arrivalTimeLabel: '',
  progress: 0.22,
  corridorLabel: '',
};

describe('mergeById', () => {
  it('نسخة الوارد تفوز ولا يضيع ما لم يرد', () => {
    const merged = mergeById(
      [{ id: 'a', v: 1 }, { id: 'b', v: 1 }],
      [{ id: 'a', v: 2 }, { id: 'c', v: 1 }]
    );
    expect(merged.map((m) => `${m.id}${m.v}`)).toEqual(['a2', 'c1', 'b1']);
  });
});

describe('getRequestsTabForStatus', () => {
  it('يوجّه كل حالة للتبويب الصحيح', () => {
    expect(getRequestsTabForStatus('open_for_quotes')).toBe('open');
    expect(getRequestsTabForStatus('en_route')).toBe('active');
    expect(getRequestsTabForStatus('in_progress')).toBe('active');
    expect(getRequestsTabForStatus('completed')).toBe('history');
    expect(getRequestsTabForStatus('cancelled')).toBe('history');
  });
});

describe('applyLiveLocation', () => {
  const now = 1_700_000_000_000;
  const req = { district: 'المنصورة', customerLat: 31.04, customerLng: 31.38 };

  it('يتجاهل الموقع القديم (أكثر من 90 ثانية)', () => {
    const stale: LiveLocation = { requestId: 'r', lat: 31.0, lng: 31.3, ts: now - 120_000 };
    expect(isLiveFresh(stale, now)).toBe(false);
    expect(applyLiveLocation(baseTrip, stale, req, now).isLive).toBe(false);
  });

  it('يحسب المسافة الحقيقية ويقرّب التقدم كلما اقترب الفني', () => {
    const far: LiveLocation = { requestId: 'r', lat: 30.9, lng: 31.2, ts: now, startLat: 30.9, startLng: 31.2 };
    const near: LiveLocation = { ...far, lat: 31.035, lng: 31.375 };
    const a = applyLiveLocation(baseTrip, far, req, now);
    const b = applyLiveLocation(baseTrip, near, req, now);
    expect(a.isLive && b.isLive).toBe(true);
    expect(b.remainingKm).toBeLessThan(a.remainingKm);
    expect(b.progress).toBeGreaterThan(a.progress);
    expect(b.etaMinutes).toBeLessThanOrEqual(a.etaMinutes);
  });
});
