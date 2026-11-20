import { useCallback } from 'react';
import { ServiceQuote, QuoteStatus } from '../types/khadamat';

/**
 * Hook that manages quote lifecycle:
 * accept/reject quotes, update status, and notification creation.
 */
export function useQuotes({
  quotes,
  setQuotes,
  requests,
  setRequests,
}: {
  quotes: ServiceQuote[];
  setQuotes: (val: React.SetStateAction<ServiceQuote[]>) => void;
  requests: any[];
  setRequests: (val: React.SetStateAction<any[]>) => void;
}) {
  /**
   * Accept a quote for a request and reject all other quotes for that request.
   * Updates the request status to 'quote_accepted'.
   */
  const handleAcceptQuote = useCallback(
    (
      requestId: string,
      quoteId: string,
      paymentMethod?: 'cash' | 'wallet',
      walletProvider?: string
    ) => {
      const chosenQuote = quotes.find((q) => q.id === quoteId);
      const targetReq = requests.find((r) => r.id === requestId);
      if (!chosenQuote || !targetReq) return;

      const finalMethod = paymentMethod || targetReq.paymentMethod || 'cash';
      const finalWallet =
        finalMethod === 'wallet' ? (walletProvider ?? targetReq.walletProvider) : undefined;

      setQuotes((prev) =>
        prev.map((q) =>
          q.requestId !== requestId
            ? q
            : { ...q, status: q.id === quoteId ? 'accepted' : 'rejected' }
        )
      );

      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: 'quote_accepted' as QuoteStatus,
                acceptedQuoteId: quoteId,
                paymentMethod: finalMethod,
                walletProvider: finalWallet,
              }
            : r
        )
      );
    },
    [quotes, requests, setQuotes, setRequests]
  );

  return {
    handleAcceptQuote,
  };
}
