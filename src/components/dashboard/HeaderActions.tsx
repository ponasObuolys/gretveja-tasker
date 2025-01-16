import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NotificationsPopover } from "@/components/ui/popover-with-notifications";

export function HeaderActions() {
  const navigate = useNavigate();
  const { toast } = useToast();

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
    <div className="flex items-center justify-end space-x-2 sm:space-x-4">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/settings")}
              className="hover:bg-[#242832]"
            >
              <Settings className="h-5 w-5 text-gray-400" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Nustatymai</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <NotificationsPopover />

      <Button
        variant="ghost"
        onClick={handleLogout}
        className="text-[#FF4B6E] hover:text-[#FF3355] hover:bg-[#242832]"
      >
        Atsijungti
      </Button>
    </div>
  );
}