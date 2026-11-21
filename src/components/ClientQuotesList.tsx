import { useCallback, useMemo } from 'react';
import { ServiceRequest, Technician } from '../types/khadamat';
import { useAppStore } from '../store/useAppStore';
import { QuoteCard } from './QuoteCard';
import { Phone, MessageCircle, AlertCircle } from 'lucide-react';

interface ClientQuotesListProps {
  request: ServiceRequest;
  technicians: Technician[];
  onWhatsApp: (phone: string, technicianName: string) => void;
  onCall: (phone: string) => void;
}

/**
 * صفحة عرض العروض للعميل
 * تظهر جميع العروض المقدمة من الفنيين لطلب معين
 * ويختار العميل العرض المناسب
 */
export function ClientQuotesList({
  request,
  technicians,
  onWhatsApp,
  onCall,
}: ClientQuotesListProps) {
  const { setQuotes, setRequests, getQuotesForRequest } = useAppStore();

  // Filter quotes for this request
  const requestQuotes = useMemo(() => getQuotesForRequest(request.id), [
    request.id,
    getQuotesForRequest,
  ]);

  const acceptedQuote = requestQuotes.find((q) => q.status === 'accepted');
  const pendingQuotes = requestQuotes.filter((q) => q.status === 'pending');

  const handleAcceptQuote = useCallback(
    (quoteId: string) => {
      // Accept the quote
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === quoteId ? { ...q, status: 'accepted' } : q
        )
      );

      // Reject all other pending quotes for this request
      setQuotes((prev) =>
        prev.map((q) =>
          q.requestId === request.id && q.id !== quoteId && q.status === 'pending'
            ? { ...q, status: 'rejected' }
            : q
        )
      );

      // Update request status
      setRequests((prev) =>
        prev.map((r) =>
          r.id === request.id
            ? { ...r, status: 'quote_accepted', acceptedQuoteId: quoteId }
            : r
        )
      );
    },
    [request.id, setQuotes, setRequests]
  );

  const technicianMap = useMemo(() => {
    const map: Record<string, Technician> = {};
    technicians.forEach((t) => {
      map[t.id] = t;
    });
    return map;
  }, [technicians]);

  if (request.status === 'completed') {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800 text-center">
        <div className="text-green-600 dark:text-green-400 text-4xl mb-2">✓</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          الخدمة مكتملة
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          تم إتمام الطلب بنجاح. شكرًا لاستخدام خدماتنا.
        </p>
      </div>
    );
  }

  if (request.status === 'quote_accepted' && acceptedQuote) {
    const tech = technicianMap[acceptedQuote.technicianId];
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              تم قبول العرض
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
             {`يمكنك التواصل مع ${tech?.name || 'الفني'} الآن`}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <Phone className="w-4 h-4" />
              <span>الاتصال بالفني</span>
            </div>
            <button
              onClick={() => (tech?.phone ? onCall(tech.phone) : null)}
              disabled={!tech?.phone}
              className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {tech?.phone ? 'اتصال الآن' : 'رقم غير متوفر'}
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <MessageCircle className="w-4 h-4" />
              <span>مراسلة عبر واتساب</span>
            </div>
            <button
              onClick={() => (tech?.whatsappNumber || tech?.phone ? onWhatsApp(tech.whatsappNumber || tech.phone, tech?.name || 'الفني') : null)}
              disabled={!tech?.phone}
              className="w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {tech?.phone ? 'مراسلة عبر واتساب' : 'رقم غير متوفر'}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">تفاصيل العرض المقبول</h4>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>السعر:</span>
            <span className="font-medium">{acceptedQuote.priceEGP.toLocaleString('ar-EG')} جنيه</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>وقت الوصول المتوقع:</span>
            <span className="font-medium">{acceptedQuote.estimatedArrival}</span>
          </div>
          {acceptedQuote.notes && (
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>ملاحظات:</span>
              <span className="font-medium">{acceptedQuote.notes}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (requestQuotes.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          لا توجد عروض بعد
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          طلبك مفتوح ويلقى العروض من الفنيين في منطقتك. سيتم إشعارك عند وصول أي عرض.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            عروض الأسعار ({requestQuotes.length})
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            اختر العرض المناسب لمتطلباتك
          </p>
        </div>
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            pendingQuotes.length > 0 ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}>
            {pendingQuotes.length} قيد الانتظار
          </span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            requestQuotes.filter((q) => q.status === 'rejected').length > 0 ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}>
            {requestQuotes.filter((q) => q.status === 'rejected').length} مرفوض
          </span>
        </div>
      </div>

      {requestQuotes.map((quote) => {
        const tech = technicianMap[quote.technicianId];
        const isAccepted = quote.status === 'accepted';
        return (
          <QuoteCard
            key={quote.id}
            quote={quote}
            technician={tech || ({} as Technician)}
            onAccept={handleAcceptQuote}
            isAccepted={isAccepted}
          />
        );
      })}
    </div>
  );
}

export default ClientQuotesList;
