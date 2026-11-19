export type UserRole = 'customer' | 'technician';

export type CustomerTab = 'home' | 'categories' | 'requests' | 'notifications' | 'profile';
export type TechnicianTab =
  | 'open_requests'
  | 'accepted_jobs'
  | 'tech_stats'
  | 'notifications'
  | 'tech_profile';

export type ServiceRequestStatus =
  | 'open_for_quotes'
  | 'quote_accepted'
  | 'en_route'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type QuoteStatus = 'pending' | 'accepted' | 'rejected';

export type PaymentMethod = 'cash' | 'wallet';

export type RecurrenceFrequency = 'none' | 'daily' | 'weekly' | 'monthly';
export type RecurringScheduleStatus = 'active' | 'paused' | 'cancelled';

export interface LocationEntry {
  id: string;
  governorate: 'الدقهلية';
  center: string;
  name: string;
  displayLabel: string;
  lat: number;
  lng: number;
  isVillage?: boolean;
  isCustom?: boolean;
}

export interface OfficialDocument {
  type: 'national_id_front' | 'national_id_back' | 'commercial_register' | 'tax_card';
  label: string;
  fileName: string;
  fileSizeLabel: string;
  previewDataUrl?: string;
}

export interface RegisteredCustomer {
  id: string;
  name: string;
  phone: string;
  district: string;
  isPhoneVerified: boolean;
  createdAt: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  shortDesc: string;
  iconKey:
    | 'ac'
    | 'plumbing'
    | 'electrical'
    | 'cleaning'
    | 'carpentry'
    | 'painting'
    | 'appliances'
    | 'electronics'
    | 'networks'
    | 'carwash'
    | 'pest_control'
    | 'security_tech'
    | 'moving'
    | 'tanks_garden'
    | 'aluminum_gypsum';
  servicesCount: number;
}

export interface ServiceItem {
  id: string;
  categoryId: string;
  title: string;
  summary: string;
  description: string;
  estimatedDuration: string;
  rating: number;
  reviewsCount: number;
  warrantyDays: number;
  imageUrl?: string;
  included: string[];
  isPopular?: boolean;
}

export interface SeasonalBundle {
  id: string;
  title: string;
  subtitle: string;
  seasonLabel: string;
  categoryId: string;
  serviceId: string;
  promoCode: string;
  discountPercent: number;
  maxDiscountEGP: number;
  estimatedSavingsLabel: string;
  includedTasks: string[];
}

export interface PromoCode {
  code: string;
  title: string;
  discountPercent: number;
  maxDiscountEGP: number;
  applicableCategoryIds?: string[];
}

export interface Technician {
  id: string;
  name: string;
  isCompany: boolean;
  specialty: string;
  categoryIds: string[];
  area: string;
  primaryCenter: string;
  coveredCenters: string[];
  coveredAreas: string[];
  documents?: OfficialDocument[];
  isVerifiedDocs?: boolean;
  isPhoneVerified?: boolean;
  rating: number;
  reviewsCount: number;
  completedJobs: number;
  yearsExp: number;
  phone: string;
  initials: string;
}

export interface ServiceQuote {
  id: string;
  requestId: string;
  technicianId: string;
  technicianName: string;
  isCompany: boolean;
  technicianRating: number;
  technicianCompletedJobs: number;
  technicianPhone: string;
  priceEGP: number;
  estimatedArrival: string;
  warrantyLabel?: string;
  notes: string;
  createdAt: string;
  status: QuoteStatus;
}

export interface RequestMessage {
  id: string;
  requestId: string;
  technicianId: string;
  technicianName: string;
  senderRole: UserRole;
  text: string;
  createdAt: string;
}

export interface RequestRoutingInfo {
  matchType: 'exact_area' | 'exact_center' | 'nearest_center';
  notifiedCount: number;
  nearestCenterName: string;
  distanceKm: number;
}

export interface ServiceRequest {
  id: string;
  referenceCode: string;
  categoryId: string;
  categoryName: string;
  serviceTitle: string;
  detailedDescription: string;
  district: string;
  addressText: string;
  preferredDate: string;
  preferredTime: string;
  customerName: string;
  customerPhone: string;
  status: ServiceRequestStatus;
  paymentMethod: PaymentMethod;
  walletProvider?: string;
  recurrenceScheduleId?: string;
  recurrenceFrequency?: Exclude<RecurrenceFrequency, 'none'>;
  recurrenceCycleNumber?: number;
  createdAt: string;
  createdAtTimestamp?: number;
  enRouteStartedAt?: number;
  completedAtTimestamp?: number;
  warrantyDays?: number;
  warrantyClaimForRef?: string;
  isWarrantyClaim?: boolean;
  faultPhotos?: string[];
  promoCode?: string;
  discountPercent?: number;
  maxDiscountEGP?: number;
  loyaltyDiscountEGP?: number;
  loyaltyVoucherId?: string;
  pointsAwarded?: number;
  bundleId?: string;
  bundleTitle?: string;
  acceptedQuoteId?: string;
  rating?: number;
  review?: string;
  routingInfo?: RequestRoutingInfo;
}

export interface RecurringSchedule {
  id: string;
  frequency: Exclude<RecurrenceFrequency, 'none'>;
  categoryId: string;
  categoryName: string;
  serviceTitle: string;
  detailedDescription: string;
  district: string;
  addressText: string;
  preferredTime: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  walletProvider?: string;
  startDateISO: string;
  nextRunDateISO: string;
  lastRunDateISO?: string;
  generatedCount: number;
  status: RecurringScheduleStatus;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  recipientRole: UserRole;
  recipientTechId?: string;
  type:
    | 'new_request'
    | 'new_quote'
    | 'quote_accepted'
    | 'tech_en_route'
    | 'job_completed'
    | 'recurring_generated'
    | 'new_message'
    | 'job_started'
    | 'request_cancelled';
  title: string;
  body: string;
  requestId: string;
  createdAt: string;
  isRead: boolean;
}

export interface SavedAddress {
  id: string;
  label: string;
  district: string;
  streetDetails: string;
  buildingFloor: string;
  isDefault: boolean;
}

export interface UserProfile {
  name: string;
  phone: string;
  defaultDistrict: string;
}

export interface TechnicianReview {
  id: string;
  technicianId: string;
  customerName: string;
  area: string;
  serviceTitle: string;
  rating: number;
  review: string;
  dateLabel: string;
  priceEGP?: number;
}

export interface LoyaltyRewardTier {
  id: string;
  title: string;
  pointsCost: number;
  discountEGP: number;
  promoCode: string;
  description: string;
}

export interface LoyaltyRedemption {
  id: string;
  rewardId: string;
  title: string;
  pointsSpent: number;
  discountEGP: number;
  promoCode: string;
  redeemedAt: string;
  isUsed: boolean;
  usedRequestRef?: string;
}


export type PlannerHomeType = 'apartment' | 'villa' | 'office';
export type PlannerSeasonFocus = 'summer' | 'winter' | 'year_round';

export interface HomePlannerProfile {
  homeType: PlannerHomeType;
  acUnits: number;
  seasonFocus: PlannerSeasonFocus;
  priorityCategories: string[];
}

export interface PlannerRecommendation {
  id: string;
  categoryId: string;
  serviceId: string;
  serviceTitle: string;
  priority: 'high' | 'recommended' | 'preventive';
  reason: string;
  recommendedFrequency: Exclude<RecurrenceFrequency, 'none'> | 'none';
  recommendedPromoCode: string;
  estimatedSavingLabel: string;
  alreadyCoveredByWarranty?: string;
  alreadyScheduled?: boolean;
}

export type AccountSession =
  | {
      role: 'customer';
      customer: UserProfile;
    }
  | {
      role: 'technician';
      technicianId: string;
    };
