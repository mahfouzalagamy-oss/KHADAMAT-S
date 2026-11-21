import { ServiceQuote, Technician } from '../types/khadamat';
import { Phone, Clock, MapPin, ShieldCheck } from 'lucide-react';

interface QuoteCardProps {
  quote: ServiceQuote;
  technician: Technician;
  onAccept: (quoteId: string, technicianId: string) => void;
  isAccepted?: boolean;
  className?: string;
}

/**
 * بطاقة عرض السعر من فني
 * تعرض السعر، وقت الوصول المتوقع، تقييم الفني، وأيضًا زر قبول للعميل
 */
export function QuoteCard({
  quote,
  technician,
  onAccept,
  isAccepted = false,
  className = '',
}: QuoteCardProps) {
  const isPending = quote.status === 'pending';
  const isAcceptedQuote = quote.status === 'accepted';
  const isRejected = quote.status === 'rejected';

  const priceLabel = `${quote.priceEGP.toLocaleString('ar-EG')} جنيه`;
  const ratingDisplay = technician.rating.toFixed(1);
  const reviewsLabel = `${technician.reviewsCount} تقييم`;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-4 transition-all duration-200 ${
        isAcceptedQuote ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20' : ''
      } ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Info Left */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900 dark:text-white">
              {technician.name}
            </span>
            {technician.isCompany && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded-full">
                شركة
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>
              {technician.reviewsCount > 0 ? ratingDisplay : 'جديد'} • {reviewsLabel}
            </span>
            <span className="ml-2">· {technician.yearsExp} سنوات خبرة</span>
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            <MapPin className="w-4 h-4 inline mr-1" />
            {technician.area}
          </div>
        </div>

        {/* Price & Actions */}
        <div className="flex flex-col md:flex-row items-end justify-between gap-3 w-full md:w-auto">
          <div className="text-right md:text-left">
            <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
              {priceLabel}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              estimated total
            </div>
          </div>

          <div className="flex gap-2">
            {isAccepted ? (
              <button
                disabled
                className="px-4 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-lg font-medium cursor-not-allowed"
              >
                تم القبول ✓
              </button>
            ) : isPending ? (
              <button
                onClick={() => onAccept(quote.id, technician.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isAcceptedQuote
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isAcceptedQuote ? 'مقبول' : 'اختيار هذا العرض'}
              </button>
            ) : (
              <button disabled className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg font-medium cursor-not-allowed">
                {isRejected ? 'مرفوض' : 'غير متاح'}
              </button>
            )}
          </div>
        </div>

        {/* Quick Info Row */}
        <div className="flex flex-col md:flex-row justify-between items-center w-full mt-4 md:mt-0 pt-4 md:pt-0 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>{quote.estimatedArrival}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Phone className="w-4 h-4" />
            <span>{technician.phone}</span>
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-700 dark:text-gray-300 italic">
              "{quote.notes}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuoteCard;
