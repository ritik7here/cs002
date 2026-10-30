import { apiClient } from "./client";
import { AppNotification } from "../types";

interface NotificationResponse {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: AppNotification["type"];
  read: boolean;
  action_view?: string | null;
  action_id?: string | null;
  created_at: string;
}

function adapt(item: NotificationResponse): AppNotification {
  return {
    id: item.id,
    userId: item.user_id,
    title: item.title,
    message: item.message,
    type: item.type,
    read: item.read,
    timestamp: new Date(item.created_at).toLocaleString(),
    actionView: item.action_view || undefined,
    actionId: item.action_id || undefined,
  };
}

export const notificationsApi = {
  listMine: async (): Promise<AppNotification[]> => {
    const rows = await apiClient<NotificationResponse[]>("/notifications/mine");
    return rows.map(adapt);
  },
  markRead: async (id: string): Promise<AppNotification> =>
    adapt(
      await apiClient<NotificationResponse>(
        `/notifications/${encodeURIComponent(id)}/read`,
        { method: "PATCH" },
      ),
    ),
  markAllRead: async (): Promise<void> => {
    await apiClient<{ updated: number }>("/notifications/read-all", {
      method: "POST",
    });
  },
};
