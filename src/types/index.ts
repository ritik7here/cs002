export type UserRole = "donor" | "ngo" | "admin" | "guest";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  location: string;
  organizationId?: string; // If role is 'ngo'
  verified?: boolean;
  status: "active" | "suspended";
  createdAt: string;
}

export type CauseCategory =
  | "Disaster Relief"
  | "Hunger & Nutrition"
  | "Education & Youth"
  | "Healthcare & Medical"
  | "Shelter & Clothing"
  | "Environment & Animal Welfare"
  | "Women Empowerment"
  | "Elderly Care";

export type DonationCategory =
  | "Food & Groceries"
  | "Clothing & Blankets"
  | "Medical Supplies"
  | "Educational Material"
  | "Electronics & Devices"
  | "Financial Aid"
  | "Hygiene & Sanitation"
  | "Other Essentials";

export type ItemCondition =
  | "Brand New"
  | "Gently Used"
  | "Used - Good Condition"
  | "Not Applicable (Consumable/Cash)";

export type UrgencyLevel = "Low" | "Medium" | "High" | "Critical / Emergency";

export type DonationStatus =
  | "Submitted"
  | "Matched"
  | "Pickup Scheduled"
  | "In Transit"
  | "Received by NGO"
  | "Distributed"
  | "Cancelled";

export interface DonationStatusHistoryEvent {
  fromStatus?: DonationStatus;
  toStatus: DonationStatus;
  changedAt: string;
}

export interface TimelineEvent {
  step: string;
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
  actor?: string;
  location?: string;
}

export interface Donation {
  id: string;
  donorId: string;
  donorName: string;
  donorEmail: string;
  donorPhone?: string;
  title: string;
  category: DonationCategory;
  description: string;
  quantity: number;
  unit: string;
  estimatedValue?: number;
  condition: ItemCondition;
  pickupAddress: string;
  city: string;
  state: string;
  pincode: string;
  urgency: UrgencyLevel;
  status: DonationStatus;
  matchedNgoId?: string;
  matchedNgoName?: string;
  targetRequirementId?: string;
  trackingTimeline: TimelineEvent[];
  statusHistory?: DonationStatusHistoryEvent[];
  proofPhotos?: string[];
  beneficiaryNotes?: string;
  distributionDate?: string;
  beneficiariesCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface NGO {
  id: string;
  name: string;
  slug: string;
  registrationNumber: string;
  taxExemptId: string; // 80G / 501(c)(3)
  verified: boolean;
  verificationStatus: "verified" | "pending" | "under_review" | "rejected";
  causes: CauseCategory[];
  description: string;
  missionStatement: string;
  contactEmail: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  website: string;
  foundedYear: number;
  beneficiariesCount: number;
  activeCampaignsCount: number;
  certifications: string[];
  trustScore: number; // 0-100
  bannerImage?: string;
  logoInitial: string;
}

export interface Requirement {
  id: string;
  ngoId: string;
  ngoName: string;
  ngoCity: string;
  ngoVerified: boolean;
  title: string;
  category: DonationCategory;
  cause: CauseCategory;
  targetQuantity: number;
  fulfilledQuantity: number;
  unit: string;
  urgency: UrgencyLevel;
  description: string;
  beneficiaryGroup: string;
  neededByDate: string;
  status: "Open" | "Partially Fulfilled" | "Fulfilled" | "Closed";
  createdAt: string;
}

export interface DonationClaim {
  id: string;
  donationId: string;
  ngoId: string;
  ngoName: string;
  status: "pending" | "accepted" | "declined";
  proposedPickupDate: string;
  notes: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "alert";
  read: boolean;
  timestamp: string;
  actionView?: string;
  actionId?: string;
}

export interface DistributionRecord {
  id: string;
  donationId: string;
  donationTitle: string;
  ngoId: string;
  ngoName: string;
  distributionDate: string;
  location: string;
  beneficiariesReached: number;
  proofImageUrl?: string;
  impactReport: string;
  notesToDonor: string;
}
