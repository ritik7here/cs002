import { apiClient } from "./client";
import { Requirement } from "../types";

export interface RequirementCreatePayload {
  title: string;
  category: string;
  cause: string;
  target_quantity: number;
  unit: string;
  urgency: string;
  description: string;
  beneficiary_group: string;
  needed_by_date?: string | null;
}

interface RequirementBackendResponse {
  id: string;
  ngo_id: string;
  ngo_name?: string;
  ngo_city?: string;
  ngo_verified?: boolean;
  title: string;
  category: string;
  cause: string;
  target_quantity: number;
  fulfilled_quantity: number;
  unit: string;
  urgency: string;
  description: string;
  beneficiary_group: string;
  needed_by_date?: string | null;
  status: Requirement["status"];
  created_at?: string | null;
}

export function adaptRequirementResponse(
  item: RequirementBackendResponse,
): Requirement {
  return {
    id: item.id,
    ngoId: item.ngo_id,
    ngoName: item.ngo_name || "Community NGO",
    ngoCity: item.ngo_city || "",
    ngoVerified: Boolean(item.ngo_verified),
    title: item.title,
    category: item.category as Requirement["category"],
    cause: item.cause as Requirement["cause"],
    targetQuantity: item.target_quantity,
    fulfilledQuantity: item.fulfilled_quantity,
    unit: item.unit,
    urgency: item.urgency as Requirement["urgency"],
    description: item.description,
    beneficiaryGroup: item.beneficiary_group,
    neededByDate: item.needed_by_date || "",
    status: item.status,
    createdAt: item.created_at || "",
  };
}

export const requirementsApi = {
  list: async (): Promise<Requirement[]> => {
    const items =
      await apiClient<RequirementBackendResponse[]>("/requirements");
    return items.map(adaptRequirementResponse);
  },
  create: async (payload: RequirementCreatePayload): Promise<Requirement> => {
    const item = await apiClient<RequirementBackendResponse>("/requirements", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return adaptRequirementResponse(item);
  },
  recordFulfillment: async (
    id: string,
    amount: number,
  ): Promise<Requirement> => {
    const item = await apiClient<RequirementBackendResponse>(
      `/requirements/${encodeURIComponent(id)}/fulfillment`,
      {
        method: "POST",
        body: JSON.stringify({ amount }),
      },
    );
    return adaptRequirementResponse(item);
  },
};
