import type { AppNotification } from '../types/khadamat';
import { useAppStore } from '../store/useAppStore';

/** إلغاء طلب: يرفض العروض المعلّقة ويُبلّغ كل فني قدّم عرضاً (يُستخدم من واجهة العميل ولوحة الإدارة). */
export function cancelRequest(requestId: string) {
  const { requests, quotes, setRequests, setQuotes, setNotifications } = useAppStore.getState();
  const target = requests.find((r) => r.id === requestId);
  if (!target || target.status === 'cancelled' || target.status === 'completed') return;

  setRequests(requests.map((r) => (r.id === requestId ? { ...r, status: 'cancelled' } : r)));

  const related = quotes.filter((q) => q.requestId === requestId && q.status !== 'rejected');
  setQuotes(quotes.map((q) => (q.requestId === requestId && q.status !== 'rejected' ? { ...q, status: 'rejected' } : q)));

  const techIds = Array.from(new Set(related.map((q) => q.technicianId)));
  if (techIds.length === 0) return;
  const alerts: AppNotification[] = techIds.map((techId, idx) => ({
    id: `notif-cancel-${Date.now()}-${idx}-${techId}`,
    recipientRole: 'technician',
    recipientTechId: techId,
    type: 'request_cancelled',
    title: `تم إلغاء الطلب (#${target.referenceCode})`,
    body: `أُلغي طلب «${target.serviceTitle}» في ${target.district}. لم يعد متاحاً لتقديم عروض أو تنفيذ.`,
    requestId,
    createdAt: 'الآن',
    isRead: false,
  }));
  setNotifications([...alerts, ...useAppStore.getState().notifications]);
}
