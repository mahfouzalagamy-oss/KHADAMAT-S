import { useCallback } from 'react';
import { LoyaltyRedemption, LoyaltyRewardTier } from '../types/khadamat';
import { computeCustomerPointsSummary } from '../data/khadamatData';

/**
 * Hook that manages loyalty points:
 * redeem points for rewards, use vouchers, compute summary.
 */
export function useLoyalty({
  requests,
  loyaltyRedemptions,
  setLoyaltyRedemptions,
}: {
  requests: any[];
  loyaltyRedemptions: LoyaltyRedemption[];
  setLoyaltyRedemptions: (val: React.SetStateAction<LoyaltyRedemption[]>) => void;
}) {
  /**
   * Redeem points for a reward tier.
   * Returns false if insufficient points.
   */
  const handleRedeemPoints = useCallback(
    (reward: LoyaltyRewardTier) => {
      const summary = computeCustomerPointsSummary(requests, loyaltyRedemptions);
      if (summary.availablePoints < reward.pointsCost) return false;

      const newRedemption: LoyaltyRedemption = {
        id: `loy-${Date.now()}`,
        rewardId: reward.id,
        title: reward.title,
        pointsSpent: reward.pointsCost,
        discountEGP: reward.discountEGP,
        promoCode: reward.promoCode,
        redeemedAt: 'الآن',
        isUsed: false,
      };

      setLoyaltyRedemptions((prev) => [newRedemption, ...prev]);
      return true;
    },
    [requests, loyaltyRedemptions, setLoyaltyRedemptions]
  );

  /**
   * Mark a redemption as used.
   */
  const markRedemptionUsed = useCallback(
    (redemptionId: string) => {
      setLoyaltyRedemptions((prev) =>
        prev.map((r) => (r.id === redemptionId ? { ...r, isUsed: true } : r))
      );
    },
    [setLoyaltyRedemptions]
  );

  /**
   * Get available points balance.
   */
  const availablePoints = computeCustomerPointsSummary(
    requests,
    loyaltyRedemptions
  ).availablePoints;

  return {
    availablePoints,
    loyaltyRedemptions,
    handleRedeemPoints,
    markRedemptionUsed,
  };
}
