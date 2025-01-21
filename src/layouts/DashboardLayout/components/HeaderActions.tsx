import { Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
    <div className="flex items-center justify-end space-x-4">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSettingsClick}
              className={`hover:bg-[#242832] transition-colors ${
                isSettingsActive ? 'bg-[#242832] text-white' : 'text-gray-400'
              }`}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Nustatymai</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Button
        variant="ghost"
        onClick={handleLogout}
        className="text-[#FF4B6E] hover:text-[#FF3355] hover:bg-[#242832]"
      >
        <LogOut className="h-5 w-5 mr-2" />
        Atsijungti
      </Button>
    </div>
  );
}

export default HeaderActions;