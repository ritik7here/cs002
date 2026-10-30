import { apiClient } from "./client";

export interface DistributionRecord {
  id: string;
  donation_id: string;
  ngo_id: string;
  distribution_date: string;
  quantity_distributed: number;
  location: string;
  beneficiaries_reached: number;
  proof_image_url?: string | null;
  impact_report: string;
  notes_to_donor: string;
  created_at?: string | null;
  updated_at?: string | null;
  donation_title?: string | null;
  donation_quantity?: number | null;
  donation_unit?: string | null;
  donation_status?: string | null;
  donor_id?: string | null;
  donor_name?: string | null;
  ngo_name?: string | null;
}

export interface DistributionCreatePayload {
  donation_id: string;
  distribution_date: string;
  quantity_distributed: number;
  location: string;
  beneficiaries_reached: number;
  proof_image_url?: string;
  impact_report: string;
  notes_to_donor?: string;
}

export const distributionsApi = {
  listMine: () => apiClient<DistributionRecord[]>("/distributions/mine"),
  confirmReceived: (donationId: string) =>
    apiClient<{ donation_id: string; status: string }>(
      `/distributions/donations/${encodeURIComponent(donationId)}/receive`,
      {
        method: "POST",
      },
    ),
  create: (payload: DistributionCreatePayload) =>
    apiClient<DistributionRecord>("/distributions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
