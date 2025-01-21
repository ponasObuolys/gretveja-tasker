import { create } from "zustand";
import { Tables } from "@/integrations/supabase/types";

interface NotificationState {
  notifications: Tables<"notifications">[];
  unreadCount: number;
  setNotifications: (notifications: Tables<"notifications">[]) => void;
  markAsRead: (notificationId: string) => void;
  addNotification: (notification: Tables<"notifications">) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => n.unread).length,
    }),
  markAsRead: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, unread: false } : n
      ),
      unreadCount: state.notifications.filter((n) => n.unread && n.id !== notificationId)
        .length,
    })),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.unread ? 1 : 0),
    })),
}));