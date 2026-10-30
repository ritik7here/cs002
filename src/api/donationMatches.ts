import { apiClient } from "./client";
import type {
  DonationCategory,
  ItemCondition,
  DonationStatus,
  UrgencyLevel,
  CauseCategory,
  Requirement,
} from "../types";

export interface DonationMatchRecommendation {
  score: number;
  reasons: string[];
  donation: {
    id: string;
    title: string;
    category: DonationCategory;
    description: string;
    quantity: number;
    unit: string;
    city: string;
    state: string;
    urgency: UrgencyLevel;
    condition: ItemCondition;
    status: DonationStatus;
    donor_name?: string | null;
  };
  requirement: {
    id: string;
    ngo_id: string;
    ngo_name: string;
    ngo_city: string;
    title: string;
    category: DonationCategory;
    cause: CauseCategory;
    target_quantity: number;
    fulfilled_quantity: number;
    unit: string;
    urgency: UrgencyLevel;
    description: string;
    beneficiary_group: string;
    needed_by_date?: string | null;
    status: Requirement["status"];
  };
}

export const donationMatchesApi = {
  listRecommendations: (): Promise<DonationMatchRecommendation[]> =>
    apiClient<DonationMatchRecommendation[]>(
      "/donation-matches/recommendations",
    ),
};
