import { useCallback, useMemo } from 'react';
import { ServiceRequest, RecurringSchedule, RequestMessage } from '../types/khadamat';
import { computeCustomerPointsSummary, getTodayISO } from '../data/khadamatData';

/**
 * Hook that manages service request lifecycle:
 * create, update status, cancel, recurring schedules, and messages.
 */
export function useRequests({
  requests,
  setRequests,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  quotes,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setQuotes,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  messages,
  setMessages,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  recurringSchedules,
  setRecurringSchedules,
  loyaltyRedemptions,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setLoyaltyRedemptions,
}: {
  requests: ServiceRequest[];
  setRequests: (val: React.SetStateAction<ServiceRequest[]>) => void;
  quotes: any[];
  setQuotes: (val: React.SetStateAction<any[]>) => void;
  messages: RequestMessage[];
  setMessages: (val: React.SetStateAction<RequestMessage[]>) => void;
  recurringSchedules: RecurringSchedule[];
  setRecurringSchedules: (val: React.SetStateAction<RecurringSchedule[]>) => void;
  loyaltyRedemptions: any[];
  setLoyaltyRedemptions: (val: React.SetStateAction<any[]>) => void;
}) {
  /**
   * Cancel a request by setting its status to 'cancelled'.
   */
  const handleCancelRequest = useCallback(
    (requestId: string) => {
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: 'cancelled' } : r))
      );
    },
    [setRequests]
  );

  /**
   * Send a message from customer or technician on a request.
   */
  const handleSendRequestMessage = useCallback(
    (
      requestId: string,
      technicianId: string,
      technicianName: string,
      senderRole: 'customer' | 'technician',
      text: string
    ) => {
      const clean = text.trim();
      if (!clean) return;

      const newMsg: RequestMessage = {
        id: `msg-${Date.now()}`,
        requestId,
        technicianId,
        technicianName,
        senderRole,
        text: clean,
        createdAt: 'الآن',
      };

      setMessages((prev) => [...prev, newMsg]);

      const notification = {
        id: `notif-msg-${Date.now()}`,
        recipientRole: senderRole === 'customer' ? 'technician' : 'customer',
        recipientTechId: senderRole === 'customer' ? technicianId : undefined,
        type: 'new_message' as const,
        title:
          senderRole === 'customer'
            ? `رسالة جديدة من العميل (#${requestId})`
            : `رسالة من ${technicianName} (#${requestId})`,
        body: clean,
        requestId,
        createdAt: 'الآن',
        isRead: false,
      };

      setMessages((prev) => [...prev, notification as unknown as RequestMessage]);
    },
    [setMessages]
  );

  /**
   * Create a new recurring schedule.
   */
  const createRecurringSchedule = useCallback(
    (
      frequency: 'daily' | 'weekly' | 'monthly',
      categoryId: string,
      categoryName: string,
      serviceTitle: string,
      detailedDescription: string,
      district: string,
      addressText: string,
      preferredTime: string,
      customerName: string,
      customerPhone: string,
      paymentMethod: 'cash' | 'wallet',
      startDateISO: string,
      walletProvider?: string
    ) => {
      const newSchedule: RecurringSchedule = {
        id: `rec-${Date.now()}`,
        frequency,
        categoryId,
        categoryName,
        serviceTitle,
        detailedDescription,
        district,
        addressText,
        preferredTime,
        customerName,
        customerPhone,
        paymentMethod,
        walletProvider,
        startDateISO,
        nextRunDateISO: startDateISO,
        status: 'active',
        generatedCount: 0,
        createdAt: getTodayISO(),
      };

      setRecurringSchedules((prev) => [newSchedule, ...prev]);
    },
    [setRecurringSchedules]
  );

  /**
   * Toggle recurring schedule status between active and paused.
   */
  const toggleRecurringStatus = useCallback(
    (scheduleId: string) => {
      setRecurringSchedules((prev) =>
        prev.map((s) =>
          s.id === scheduleId ? { ...s, status: s.status === 'active' ? 'paused' : 'active' } : s
        )
      );
    },
    [setRecurringSchedules]
  );

  /**
   * Cancel a recurring schedule.
   */
  const cancelRecurringSchedule = useCallback(
    (scheduleId: string) => {
      setRecurringSchedules((prev) =>
        prev.map((s) => (s.id === scheduleId ? { ...s, status: 'cancelled' } : s))
      );
    },
    [setRecurringSchedules]
  );

  /**
   * Compute customer points summary from requests and redemptions.
   */
  const pointsSummary = useMemo(() => {
    return computeCustomerPointsSummary(requests, loyaltyRedemptions);
  }, [requests, loyaltyRedemptions]);

  return {
    // Actions
    handleCancelRequest,
    handleSendRequestMessage,
    createRecurringSchedule,
    toggleRecurringStatus,
    cancelRecurringSchedule,
    // Computed
    pointsSummary,
  };
}
