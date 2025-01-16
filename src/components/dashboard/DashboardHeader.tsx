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
import { useSearchStore } from "@/stores/searchStore";
import { NotificationsPopover } from "@/components/ui/popover-with-notifications";

export function DashboardHeader() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { searchQuery, setSearchQuery } = useSearchStore();

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('DashboardHeader: Search input changed:', value);
    setSearchQuery(value);
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 lg:p-6 gap-4">
      <div className="relative w-full sm:max-w-lg">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
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
    </div>
  );
}