import { useCallback, useState } from 'react';
import { ServiceItem, SeasonalBundle } from '../types/khadamat';

/**
 * Hook that manages all modal open/close states and UI modal data.
 * Centralizes modal logic so App.tsx doesn't have 20+ useState calls.
 */
export function useModalState() {
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isSmartPlannerOpen, setIsSmartPlannerOpen] = useState(false);
  const [viewingTechStatsId, setViewingTechStatsId] = useState<string | null>(null);

  const [requestInitialService, setRequestInitialService] = useState<ServiceItem | null>(null);
  const [requestInitialCategoryId, setRequestInitialCategoryId] = useState<string | undefined>(
    undefined
  );
  const [requestInitialBundle, setRequestInitialBundle] = useState<SeasonalBundle | null>(null);
  const [warrantyClaimTarget, setWarrantyClaimTarget] = useState<{
    originalRequest: any;
    technicianName?: string;
    warrantyDays: number;
  } | null>(null);
  const [initialLoyaltyVoucher, setInitialLoyaltyVoucher] = useState<any>(null);

  const handleOpenRequestModal = useCallback((service?: ServiceItem, categoryId?: string) => {
    setWarrantyClaimTarget(null);
    setInitialLoyaltyVoucher(null);
    setRequestInitialBundle(null);
    setRequestInitialService(service || null);
    setRequestInitialCategoryId(categoryId || service?.categoryId);
    setIsRequestModalOpen(true);
  }, []);

  const handleRequestBundle = useCallback((bundle: SeasonalBundle) => {
    const matchedService = null; // Will be resolved by parent using SERVICES_CATALOG
    setWarrantyClaimTarget(null);
    setInitialLoyaltyVoucher(null);
    setRequestInitialBundle(bundle);
    setRequestInitialService(matchedService);
    setRequestInitialCategoryId(bundle.categoryId);
    setIsRequestModalOpen(true);
  }, []);

  const handleRequestWarrantyCheck = useCallback((originalRequest: any, quote?: any) => {
    setRequestInitialBundle(null);
    setRequestInitialService(null);
    setRequestInitialCategoryId(originalRequest.categoryId);
    setWarrantyClaimTarget({
      originalRequest,
      technicianName: quote?.technicianName,
      warrantyDays: originalRequest.warrantyDays || parseWarrantyDays(quote?.warrantyLabel, 30),
    });
    setIsRequestModalOpen(true);
  }, []);

  const handleUseLoyaltyVoucher = useCallback((voucher: any) => {
    setWarrantyClaimTarget(null);
    setRequestInitialBundle(null);
    setRequestInitialService(null);
    setRequestInitialCategoryId(undefined);
    setInitialLoyaltyVoucher(voucher);
    setIsRequestModalOpen(true);
  }, []);

  return {
    // States
    isLocationModalOpen,
    setIsLocationModalOpen,
    isRequestModalOpen,
    setIsRequestModalOpen,
    isSmartPlannerOpen,
    setIsSmartPlannerOpen,
    viewingTechStatsId,
    setViewingTechStatsId,
    requestInitialService,
    setRequestInitialService,
    requestInitialCategoryId,
    setRequestInitialCategoryId,
    requestInitialBundle,
    setRequestInitialBundle,
    warrantyClaimTarget,
    setWarrantyClaimTarget,
    initialLoyaltyVoucher,
    setInitialLoyaltyVoucher,
    // Actions
    handleOpenRequestModal,
    handleRequestBundle,
    handleRequestWarrantyCheck,
    handleUseLoyaltyVoucher,
  };
}

/**
 * Parse warranty days from label string, fallback to default.
 */
function parseWarrantyDays(label: string | undefined, fallback: number): number {
  if (!label) return fallback;
  const match = label.match(/(\d+)\s*يوم/);
  return match ? parseInt(match[1], 10) : fallback;
}
