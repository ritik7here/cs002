import { apiClient } from "./client";

export type PickupStatus =
  | "scheduled"
  | "confirmed"
  | "picked_up"
  | "cancelled";

export interface PickupRecord {
  id: string;
  donation_id: string;
  scheduled_date?: string | null;
  picked_up_at?: string | null;
  status: PickupStatus;
  notes: string;
  created_at?: string | null;
  updated_at?: string | null;
  donation_title?: string | null;
  donation_city?: string | null;
  donation_status?: string | null;
  donor_id?: string | null;
  donor_name?: string | null;
  ngo_id?: string | null;
  ngo_name?: string | null;
}

export const pickupsApi = {
  listMine: () => apiClient<PickupRecord[]>("/pickups/mine"),
  schedule: (payload: {
    donation_id: string;
    scheduled_date: string;
    notes?: string;
  }) =>
    apiClient<PickupRecord>("/pickups", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateStatus: (pickupId: string, status: PickupStatus, notes?: string) =>
    apiClient<PickupRecord>(`/pickups/${encodeURIComponent(pickupId)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, notes }),
    }),
};
