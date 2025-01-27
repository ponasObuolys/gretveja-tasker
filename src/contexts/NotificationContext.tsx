import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TaskProfile {
  email: string | null;
  avatar_url: string | null;
}

interface TaskWithCreator {
  title: string;
  created_by_profile?: TaskProfile;
}

interface Notification {
  id: string;
  user_id: string;
  task_id: string | null;
  action: string;
  unread: boolean;
  created_at: string;
  task?: TaskWithCreator | null;
  profile?: {
    email: string | null;
    avatar_url: string | null;
  } | null;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log("Fetching notifications for user:", user.id);
      
      const { data, error } = await supabase
        .from("notifications")
        .select(`
          *,
          task:tasks(
            title,
            created_by_profile:profiles!tasks_created_by_fkey(email, avatar_url)
          ),
          profile:profiles!notifications_user_id_fkey(email, avatar_url)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error);
        return;
      }

      console.log("Fetched notifications:", data);
      setNotifications(data);
    };

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          console.log('New notification:', payload);
          fetchNotifications(); // Refresh notifications
          toast({
            title: "Naujas pranešimas",
            description: "Gavote naują pranešimą",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ unread: false })
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking notification as read:", error);
      return;
    }

    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, unread: false }
          : notification
      )
    );
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({ unread: false })
      .eq("user_id", user.id);

    if (error) {
      console.error("Error marking all notifications as read:", error);
      return;
    }

    setNotifications(prev =>
      prev.map(notification => ({ ...notification, unread: false }))
    );
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};