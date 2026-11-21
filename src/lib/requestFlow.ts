import type { ServiceRequestStatus } from '../types/khadamat';

export type RequestsTabId = 'open' | 'active' | 'history';

/** أي تبويب في «طلباتي» يعرض الطلب حسب حالته الفعلية */
export function getRequestsTabForStatus(status: ServiceRequestStatus): RequestsTabId {
  if (status === 'open_for_quotes') return 'open';
  if (status === 'completed' || status === 'cancelled') return 'history';
  return 'active';
}
