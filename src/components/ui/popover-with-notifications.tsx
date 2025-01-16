import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNotifications } from "@/contexts/NotificationContext";

export function NotificationsPopover() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

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
                  onClick={() => notification.unread && markAsRead(notification.id)}
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
                        {notification.task?.created_by_profile?.email || notification.profile?.email || "Nežinomas vartotojas"}
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