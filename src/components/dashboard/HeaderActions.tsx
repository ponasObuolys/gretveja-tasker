import { Settings, LogOut, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NotificationsPopover } from "@/components/ui/popover-with-notifications";

export function HeaderActions() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isSettingsActive = location.pathname === "/settings";

  const handleSettingsClick = () => {
    console.log("Settings button clicked, navigating to /settings");
    try {
      navigate("/settings");
      console.log("Navigation completed, new location:", location.pathname);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      console.log("Attempting to sign out...");
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Error during sign out:", error);
        toast({
          title: "Klaida",
          description: "Nepavyko atsijungti. Bandykite dar kartą.",
          variant: "destructive",
        });
        return;
      }

      console.log("Sign out successful");
      navigate("/");
    } catch (error) {
      console.error("Unexpected error during sign out:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko atsijungti. Bandykite dar kartą.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-end space-x-6 px-4 sm:px-0">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSettingsClick}
            className={`flex flex-col items-center min-h-[64px] hover:bg-[#242832] transition-colors ${
              isSettingsActive ? 'bg-[#242832] text-white' : 'text-gray-400'
            }`}
          >
            <Settings className="h-6 w-6 mb-1" />
            <span className="text-xs">Nustatymai</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Nustatymai</p>
        </TooltipContent>
      </Tooltip>

      <NotificationsPopover>
        <Button
          variant="ghost"
          size="icon"
          className="flex flex-col items-center min-h-[64px] hover:bg-[#242832]"
        >
          <Bell className="h-6 w-6 mb-1" />
          <span className="text-xs">Pranešimai</span>
        </Button>
      </NotificationsPopover>

      <Button
        variant="ghost"
        onClick={handleLogout}
        className="flex flex-col items-center min-h-[64px] text-[#FF4B6E] hover:text-[#FF3355] hover:bg-[#242832]"
      >
        <LogOut className="h-6 w-6 mb-1" />
        <span className="text-xs">Atsijungti</span>
      </Button>
    </div>
  );
}