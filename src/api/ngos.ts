import { apiClient } from "./client";
import { CauseCategory, NGO } from "../types";

interface NGOBackendResponse {
  id: string;
  name: string;
  slug: string;
  registration_number: string;
  tax_exempt_id: string;
  verification_status: NGO["verificationStatus"];
  description?: string;
  mission_statement?: string;
  contact_email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  website?: string;
  founded_year?: number | null;
  beneficiaries_count?: number;
  active_campaigns_count?: number;
  causes?: CauseCategory[];
  certifications?: string[];
  trust_score?: number;
  banner_image_url?: string | null;
  logo_initial?: string;
  created_at?: string | null;
  updated_at?: string | null;
}

/** Convert the backend's snake_case NGO response into the frontend model. */
export function adaptNGOResponse(item: NGOBackendResponse): NGO {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    registrationNumber: item.registration_number,
    taxExemptId: item.tax_exempt_id,
    verified: item.verification_status === "verified",
    verificationStatus: item.verification_status,
    causes: item.causes || [],
    description: item.description || "",
    missionStatement: item.mission_statement || "",
    contactEmail: item.contact_email,
    phone: item.phone || "",
    address: item.address || "",
    city: item.city || "",
    state: item.state || "",
    website: item.website || "",
    foundedYear: item.founded_year ?? 0,
    beneficiariesCount: item.beneficiaries_count || 0,
    activeCampaignsCount: item.active_campaigns_count || 0,
    certifications: item.certifications || [],
    trustScore: item.trust_score ?? 70,
    bannerImage: item.banner_image_url || undefined,
    logoInitial: item.logo_initial || item.name.slice(0, 1).toUpperCase(),
  };
}

export interface NGOCreatePayload {
  name: string;
  registration_number: string;
  tax_exempt_id: string;
  contact_email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  website?: string;
  founded_year?: number;
  description?: string;
  mission_statement?: string;
  causes?: string[];
  certifications?: string[];
}

export interface NGOProfileUpdatePayload {
  name?: string;
  contact_email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  website?: string;
  description?: string;
  mission_statement?: string;
}

export interface NGOVerificationUpdatePayload {
  verification_status: "verified" | "rejected" | "pending" | "under_review";
  reason?: string;
}

export const ngosApi = {
  list: async (status?: string): Promise<NGO[]> => {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    const items = await apiClient<NGOBackendResponse[]>(`/ngos${query}`);
    return items.map(adaptNGOResponse);
  },

  getById: async (id: string): Promise<NGO> => {
    const item = await apiClient<NGOBackendResponse>(
      `/ngos/${encodeURIComponent(id)}`,
    );
    return adaptNGOResponse(item);
  },

  register: async (payload: NGOCreatePayload): Promise<NGO> => {
    const item = await apiClient<NGOBackendResponse>("/ngos", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return adaptNGOResponse(item);
  },

  updateProfile: async (
    id: string,
    payload: NGOProfileUpdatePayload,
  ): Promise<NGO> => {
    const item = await apiClient<NGOBackendResponse>(
      `/ngos/${encodeURIComponent(id)}`,
      { method: "PATCH", body: JSON.stringify(payload) },
    );
    return adaptNGOResponse(item);
  },

  updateVerification: async (
    id: string,
    payload: NGOVerificationUpdatePayload,
  ): Promise<NGO> => {
    const item = await apiClient<NGOBackendResponse>(
      `/ngos/${encodeURIComponent(id)}/verification`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
    return adaptNGOResponse(item);
  },
};
