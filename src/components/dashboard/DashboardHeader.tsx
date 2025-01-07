import { Bell, Settings } from "lucide-react";
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

export function DashboardHeader() {
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
    <div className="flex items-center justify-between p-4">
      <div className="relative w-full max-w-lg">
        <input
          type="text"
          placeholder="Ieškoti užduočių..."
          className="w-full pl-10 pr-4 py-2 bg-[#242832] border border-gray-700 rounded-lg focus:outline-none focus:border-[#FF4B6E] text-gray-300"
        />
        <svg
          className="absolute left-3 top-2.5 h-5 w-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <div className="flex items-center space-x-4">
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

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-[#242832]"
              >
                <Bell className="h-5 w-5 text-gray-400" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Pranešimai</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className="text-[#FF4B6E] hover:text-[#FF3355] hover:bg-[#242832]"
        >
          Atsijungti
        </Button>
      </div>
    </div>
  );
}