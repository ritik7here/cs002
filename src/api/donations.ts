import { apiClient } from "./client";
import { Donation, DonationStatusHistoryEvent } from "../types";

export interface DonationCreatePayload {
  title: string;
  category: string;
  description?: string;
  quantity: number;
  unit: string;
  estimated_value?: number;
  condition: string;
  pickup_address: string;
  city: string;
  state: string;
  pincode: string;
  urgency?: string;
}

export interface DonationBackendResponse {
  id: string;
  donor_id?: string;
  donor_name?: string;
  donor_email?: string;
  title: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  estimated_value?: number;
  condition: string;
  pickup_address?: string;
  city: string;
  state: string;
  pincode?: string;
  urgency: string;
  status: string;
  matched_ngo_id?: string;
  matched_ngo_name?: string;
  target_requirement_id?: string;
  proof_photos?: string[];
  status_history?: {
    from_status?: string | null;
    to_status: string;
    changed_at: string;
  }[];
  tracking_timeline: {
    status: string;
    label: string;
    timestamp?: string;
    completed: boolean;
    actor?: string;
    notes?: string;
  }[];
  created_at: string;
  updated_at: string;
}

/**
 * Adapter converting backend snake_case response to frontend camelCase Donation model.
 */
export function adaptDonationResponse(item: DonationBackendResponse): Donation {
  return {
    id: item.id,
    donorId: item.donor_id || "",
    donorName: item.donor_name || "Anonymous Donor",
    donorEmail: item.donor_email || "",
    title: item.title,
    category: item.category as Donation["category"],
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    estimatedValue: item.estimated_value || 0,
    condition: item.condition as Donation["condition"],
    pickupAddress: item.pickup_address || "",
    city: item.city,
    state: item.state,
    pincode: item.pincode || "",
    urgency: item.urgency as Donation["urgency"],
    status: item.status as Donation["status"],
    matchedNgoId: item.matched_ngo_id,
    matchedNgoName: item.matched_ngo_name,
    targetRequirementId: item.target_requirement_id,
    proofPhotos: item.proof_photos || [],
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    trackingTimeline: (item.tracking_timeline || []).map((step) => ({
      step: step.status as Donation["status"],
      title: step.label,
      description: step.notes || "",
      timestamp: step.timestamp
        ? new Date(step.timestamp).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : step.completed
          ? "Timestamp unavailable"
          : "Pending",
      completed: step.completed,
      actor: step.actor,
    })),
    statusHistory: (item.status_history || []).map((event) => ({
      fromStatus: event.from_status as DonationStatusHistoryEvent["fromStatus"],
      toStatus: event.to_status as DonationStatusHistoryEvent["toStatus"],
      changedAt: event.changed_at,
    })),
  };
}

export const donationsApi = {
  list: async (filters?: {
    status?: string;
    category?: string;
    donor_id?: string;
  }): Promise<Donation[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.category) params.append("category", filters.category);
    if (filters?.donor_id) params.append("donor_id", filters.donor_id);
    const query = params.toString() ? `?${params.toString()}` : "";
    const items = await apiClient<DonationBackendResponse[]>(
      `/donations${query}`,
    );
    return items.map(adaptDonationResponse);
  },

  listMy: async (): Promise<Donation[]> => {
    const items = await apiClient<DonationBackendResponse[]>("/donations/my");
    return items.map(adaptDonationResponse);
  },

  listForNGO: async (): Promise<Donation[]> => {
    const items = await apiClient<DonationBackendResponse[]>("/donations/ngo");
    return items.map(adaptDonationResponse);
  },

  getById: async (id: string): Promise<Donation> => {
    const item = await apiClient<DonationBackendResponse>(
      `/donations/${encodeURIComponent(id)}`,
    );
    return adaptDonationResponse(item);
  },

  create: async (payload: DonationCreatePayload): Promise<Donation> => {
    const item = await apiClient<DonationBackendResponse>("/donations", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return adaptDonationResponse(item);
  },
};
