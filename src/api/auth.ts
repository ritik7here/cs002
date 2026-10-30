import { apiClient } from './client';
import { User } from '../types';

export interface HealthResponse {
  status: string;
  environment: string;
  timestamp: string;
}

interface BackendUserProfile {
  id: string;
  name: string;
  email: string;
  role: 'donor' | 'ngo' | 'admin';
  avatar_url?: string | null;
  phone?: string | null;
  location?: string;
  organization_id?: string | null;
  status: 'active' | 'suspended';
  created_at?: string | null;
}

function adaptUser(profile: BackendUserProfile): User {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    avatar: profile.avatar_url || undefined,
    phone: profile.phone || undefined,
    location: profile.location || '',
    organizationId: profile.organization_id || undefined,
    status: profile.status,
    createdAt: profile.created_at || new Date().toISOString(),
    verified: profile.role === 'donor',
  };
}

export const authApi = {
  getMe: async (): Promise<User> => {
    const profile = await apiClient<BackendUserProfile>('/auth/me');
    return adaptUser(profile);
  },

  getHealth: async (): Promise<HealthResponse> => apiClient<HealthResponse>('/health'),
};
