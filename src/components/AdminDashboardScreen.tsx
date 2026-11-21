import { Activity, Ban, CheckCircle2, LogOut, MapPin, ShieldCheck, Users, Wifi, WifiOff } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { LiveLocation } from '../lib/liveTracking';
import type { RealtimeStatus } from '../lib/realtime';
import type { ServiceQuote, ServiceRequest, ServiceRequestStatus, Technician } from '../types/khadamat';

interface Props {
  requests: ServiceRequest[];
  quotes: ServiceQuote[];
  technicians: Technician[];
  liveLocations: Record<string, LiveLocation>;
  realtimeStatus: RealtimeStatus;
  onCancelRequest: (id: string) => void;
  onExit: () => void;
}

const STATUS_LABEL: Record<ServiceRequestStatus, string> = {
  open_for_quotes: 'استقبال عروض',
  quote_accepted: 'تم قبول عرض',
  en_route: 'في الطريق',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};
const ADMIN_KEY = 'khadamaty:admin';
type Filter = 'all' | ServiceRequestStatus;

export function AdminDashboardScreen({
  requests,
  quotes,
  technicians,
  liveLocations,
  realtimeStatus,
  onCancelRequest,
  onExit,
}: Props) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(ADMIN_KEY) === '1');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const stats = useMemo(() => {
    const count = (s: ServiceRequestStatus) => requests.filter((r) => r.status === s).length;
    const done = count('completed');
    const finished = done + count('cancelled');
    const revenue = quotes
      .filter((q) => q.status === 'accepted' && requests.find((r) => r.id === q.requestId)?.status === 'completed')
      .reduce((sum, q) => sum + q.priceEGP, 0);
    return {
      total: requests.length,
      open: count('open_for_quotes'),
      active: count('quote_accepted') + count('en_route') + count('in_progress'),
      done,
      cancelled: count('cancelled'),
      rate: finished ? Math.round((done / finished) * 100) : 0,
      revenue,
    };
  }, [requests, quotes]);

  const techName = (reqId: string) => quotes.find((q) => q.requestId === reqId && q.status === 'accepted')?.technicianName ?? '—';
  const rows = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem(ADMIN_KEY, '1');
        setAuthed(true);
      } else setError(data.error || 'فشل الدخول');
    } catch {
      setError('الخادم غير متاح. شغّل التطبيق عبر npm run dev.');
    }
  };

  if (!authed) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <form onSubmit={login} className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-50 font-bold text-lg">
            <ShieldCheck className="w-5 h-5 text-[#FF5A00]" aria-hidden="true" /> لوحة الإدارة
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="كلمة مرور الإدارة"
            className="w-full h-11 px-3.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#FF5A00]"
          />
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="flex-1 h-11 bg-[#FF5A00] text-white font-bold text-sm rounded-xl cursor-pointer">دخول</button>
            <button type="button" onClick={onExit} className="h-11 px-4 text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer">رجوع</button>
          </div>
        </form>
      </div>
    );
  }

  const kpis = [
    { label: 'إجمالي الطلبات', value: stats.total },
    { label: 'تنتظر عروضاً', value: stats.open },
    { label: 'قيد المتابعة', value: stats.active },
    { label: 'مكتملة', value: stats.done },
    { label: 'نسبة الإتمام', value: `${stats.rate}%` },
    { label: 'قيمة الأعمال المكتملة', value: `${stats.revenue.toLocaleString('ar-EG')} ج.م` },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold"><ShieldCheck className="w-5 h-5 text-[#FF5A00]" aria-hidden="true" /> لوحة إدارة خدمات</div>
        <div className="flex items-center gap-4 text-xs">
          <span className={`inline-flex items-center gap-1 font-semibold ${realtimeStatus === 'online' ? 'text-emerald-600' : 'text-slate-500'}`}>
            {realtimeStatus === 'online' ? <Wifi className="w-4 h-4" aria-hidden="true" /> : <WifiOff className="w-4 h-4" aria-hidden="true" />}
            {realtimeStatus === 'online' ? 'متصل لحظياً' : 'غير متصل بالخادم'}
          </span>
          <button onClick={() => { sessionStorage.removeItem(ADMIN_KEY); onExit(); }} className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 cursor-pointer">
            <LogOut className="w-4 h-4" aria-hidden="true" /> خروج
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {kpis.map((k) => (
            <div key={k.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{k.label}</div>
              <div className="text-xl font-bold tabular-nums mt-1">{k.value}</div>
            </div>
          ))}
        </div>

        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold inline-flex items-center gap-2"><Activity className="w-4 h-4" aria-hidden="true" /> الطلبات</h2>
            <div className="flex flex-wrap gap-1.5">
              {(['all', ...Object.keys(STATUS_LABEL)] as Filter[]).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`px-3 h-8 text-xs rounded-lg border cursor-pointer ${filter === f ? 'bg-[#FF5A00] text-white border-[#FF5A00]' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  {f === 'all' ? 'الكل' : STATUS_LABEL[f]}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="text-xs text-slate-500 dark:text-slate-400">
                <tr><th className="py-2 px-2">الكود</th><th className="px-2">الخدمة</th><th className="px-2">العميل</th><th className="px-2">المنطقة</th><th className="px-2">الفني</th><th className="px-2">الحالة</th><th className="px-2">GPS</th><th /></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2.5 px-2 font-mono text-xs">#{r.referenceCode}</td>
                    <td className="px-2">{r.serviceTitle}</td>
                    <td className="px-2">{r.customerName}</td>
                    <td className="px-2">{r.district}</td>
                    <td className="px-2">{techName(r.id)}</td>
                    <td className="px-2">{STATUS_LABEL[r.status]}</td>
                    <td className="px-2">{liveLocations[r.id] ? <MapPin className="w-4 h-4 text-emerald-600" aria-label="موقع حي" /> : '—'}</td>
                    <td className="px-2">
                      {r.status !== 'completed' && r.status !== 'cancelled' && (
                        <button onClick={() => window.confirm('إلغاء هذا الطلب؟') && onCancelRequest(r.id)} className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 cursor-pointer">
                          <Ban className="w-3.5 h-3.5" aria-hidden="true" /> إلغاء
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-slate-400">لا توجد طلبات</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
          <h2 className="font-bold inline-flex items-center gap-2"><Users className="w-4 h-4" aria-hidden="true" /> الفنيون ({technicians.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="text-xs text-slate-500 dark:text-slate-400"><tr><th className="py-2 px-2">الاسم</th><th className="px-2">التخصص</th><th className="px-2">المركز</th><th className="px-2">التقييم</th><th className="px-2">أعمال منجزة</th><th className="px-2">التوثيق</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {technicians.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2.5 px-2 font-semibold">{t.name}</td>
                    <td className="px-2">{t.specialty}</td>
                    <td className="px-2">{t.primaryCenter}</td>
                    <td className="px-2 tabular-nums">{t.rating}</td>
                    <td className="px-2 tabular-nums">{t.completedJobs}</td>
                    <td className="px-2">{t.isVerifiedDocs ? <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-label="موثّق" /> : <span className="text-xs text-amber-600">غير موثّق</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
