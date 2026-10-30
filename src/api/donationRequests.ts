import { apiClient } from "./client";

export type DonationRequestStatus = "pending" | "accepted" | "declined";

export interface DonationRequest {
  id: string;
  donation_id: string;
  ngo_id: string;
  status: DonationRequestStatus;
  proposed_pickup_date?: string | null;
  notes: string;
  created_at?: string | null;
  updated_at?: string | null;
  donation_title?: string | null;
  donation_category?: string | null;
  donation_city?: string | null;
  donation_quantity?: number | null;
  donation_unit?: string | null;
  donor_id?: string | null;
  ngo_name?: string | null;
}

export const donationRequestsApi = {
  listMine: () => apiClient<DonationRequest[]>("/donation-requests/mine"),
  create: (payload: {
    donation_id: string;
    proposed_pickup_date?: string;
    notes?: string;
  }) =>
    apiClient<DonationRequest>("/donation-requests", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  decide: (requestId: string, decision: "accepted" | "declined") =>
    apiClient<DonationRequest>(
      `/donation-requests/${encodeURIComponent(requestId)}/decision`,
      {
        method: "PATCH",
        body: JSON.stringify({ status: decision }),
      },
    ),
};
