import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  task_id: string | null;
  action: string;
  unread: boolean;
  created_at: string;
  task: {
    title: string;
  } | null;
  profile: {
    email: string | null;
    avatar_url: string | null;
  } | null;
}

export function NotificationsPopover() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      console.log("Fetching notifications for user:", user.id);
      
      const { data, error } = await supabase
        .from("notifications")
        .select(`
          *,
          task:tasks(title),
          profile:profiles!notifications_user_id_fkey(email, avatar_url)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error);
        throw error;
      }
      
      console.log("Fetched notifications:", data);
      return data as Notification[];
    },
  });

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    console.log("Marking all notifications as read for user:", user.id);

    const { error } = await supabase
      .from("notifications")
      .update({ unread: false })
      .eq("user_id", user.id);

    if (error) {
      console.error("Error marking notifications as read:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko pažymėti pranešimų kaip skaitytų",
        variant: "destructive",
      });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  // Listen for new notifications
  useEffect(() => {
    console.log("Setting up notifications listener");
    
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          console.log('New notification:', payload);
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          toast({
            title: "Naujas pranešimas",
            description: "Gavote naują pranešimą",
          });
        }
      )
      .subscribe();

    return () => {
      console.log("Cleaning up notifications listener");
      supabase.removeChannel(channel);
    };
  }, [queryClient, toast]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-[#242832]"
          aria-label="Atidaryti pranešimus"
        >
          <Bell className="h-5 w-5 text-gray-400" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b border-gray-700 p-3">
          <h4 className="font-semibold">Pranešimai</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              className="text-sm text-gray-400 hover:text-white"
              onClick={markAllAsRead}
            >
              Žymėti visus kaip skaitytus
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400">
              Nėra pranešimų
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 hover:bg-[#242832] ${
                    notification.unread ? "bg-[#1A1D24]" : ""
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={notification.profile?.avatar_url || ""}
                      alt={notification.profile?.email || ""}
                    />
                    <AvatarFallback>
                      {notification.profile?.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">
                        {notification.profile?.email}
                      </span>{" "}
                      {notification.action}{" "}
                      <span className="font-medium">
                        {notification.task?.title}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(notification.created_at), "MMM d, HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}