import { useCallback, useMemo } from 'react';
import { ServiceRequest, Technician } from '../types/khadamat';
import { useAppStore } from '../store/useAppStore';
import { Clock, MapPin, Phone, PlusCircle } from 'lucide-react';

interface TechnicianOpenRequestsProps {
  technician: Technician;
  onSubmitQuote: (requestId: string, price: number, arrival: string, notes: string) => void;
}

/**
 * صفحة الفنى: عرض الطلبات المفتوحة في منطقته
 * يمكن للفنى إرسال عرض سعري لأي طلب
 */
export function TechnicianOpenRequests({
  technician,
  onSubmitQuote,
}: TechnicianOpenRequestsProps) {
  const { requests, quotes, getPendingQuotesForTech } = useAppStore();

  // Filter open requests that match technician's category
  const openRequests = useMemo(() => {
    return requests.filter(
      (r) =>
        r.status === 'open_for_quotes' &&
        technician.categoryIds.includes(r.categoryId)
    );
  }, [requests, technician.categoryIds]);

  // Get quotes already submitted by this technician
  const myQuotes = useMemo(() => getPendingQuotesForTech(technician.id), [
    technician.id,
    getPendingQuotesForTech,
  ]);

  const hasQuoted = (requestId: string) => myQuotes.some((q) => q.requestId === requestId);

  const handleSubmitQuote = useCallback(
    (requestId: string) => {
      const request = requests.find((r) => r.id === requestId);
      if (!request) return;

      // Open a simple dialog using prompt for MVP
      // In production, this should be a proper modal
      const price = prompt('أدخل السعر المقترح بالجنيه المصري (EGP):');
      if (!price || isNaN(Number(price))) return;

      const arrival = prompt('وقت الوصول المتوقع (مثال: خلال 45 دقيقة):');
      if (!arrival) return;

      const notes = prompt('ملاحظات إضافية (اختياري):') || '';

      onSubmitQuote(requestId, Number(price), arrival, notes);
    },
    [requests, onSubmitQuote]
  );

  if (openRequests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
          <PlusCircle className="w-10 h-10 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          لا توجد طلبات مفتوحة
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          سيتم إشعارك عند وصول طلبات جديدة في تخصصك ومنطقتك.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            طلبات مفتوحة ({openRequests.length})
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            اختر طلبًا لإرسال عرض سعري
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-medium">
            {myQuotes.length} عرض أرسلته
          </span>
        </div>
      </div>

      {openRequests.map((request) => {
        const alreadyQuoted = hasQuoted(request.id);
        return (
          <div
            key={request.id}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-4 transition-all duration-200 ${
              alreadyQuoted ? 'ring-1 ring-blue-500 bg-blue-50 dark:bg-blue-900/10' : ''
            }`}
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {request.serviceTitle}
                </h4>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <Clock className="w-4 h-4" />
                  <span>{request.preferredDate} - {request.preferredTime}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{request.district}</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                  {request.detailedDescription}
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full md:w-auto">
                {alreadyQuoted ? (
                  <button disabled className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded-lg font-medium cursor-not-allowed">
                    تم إرسال العرض
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubmitQuote(request.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    إرسال عرض سعري
                  </button>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                {request.customerName.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {request.customerName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {request.customerPhone}
                </p>
              </div>
              <div className="text-right">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  request.urgency === 'urgent' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200' : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200'
                }`}>
                  {request.urgency === 'urgent' ? 'عاجل' : 'عادي'}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TechnicianOpenRequests;
