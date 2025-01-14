import { useState } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { UserProfile } from "./UserProfile";
import { RecentActivity } from "./RecentActivity";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { DashboardContent } from "./DashboardContent";

export type TaskFilter = "all" | "recent" | "priority";

export function DashboardLayout() {
  const [activeTab, setActiveTab] = useState<TaskFilter>("all");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (error) throw error;
      return data as Tables<"profiles">;
    },
  });

  const isAdmin = profile?.role === "ADMIN";

  const handleTaskSelect = (taskId: string) => {
    setSelectedTasks(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      } else {
        return [...prev, taskId];
      }
    });
  };

  return (
    <div className="flex min-h-screen bg-[#1A1D24] text-white">
      {/* Mobile Menu */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild className="lg:hidden fixed top-4 left-4 z-50">
          <Button variant="ghost" size="icon" className="bg-background/50 backdrop-blur-sm">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[80%] sm:w-[350px] bg-[#242832] p-0 border-r border-gray-800">
          <DashboardSidebar />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 min-w-64 border-r border-gray-800 max-h-screen">
        <DashboardSidebar />
      </div>
      
      <div className="flex-1 flex flex-col min-h-screen">
        <DashboardHeader />
        
        <DashboardContent
          isAdmin={isAdmin}
          activeTab={activeTab}
          isSelectionMode={isSelectionMode}
          selectedTasks={selectedTasks}
          setActiveTab={setActiveTab}
          setIsSelectionMode={setIsSelectionMode}
          setSelectedTasks={setSelectedTasks}
          handleTaskSelect={handleTaskSelect}
        />
      </div>

      {/* Right Sidebar */}
      <div className="hidden xl:block w-80 min-w-80 bg-[#242832] border-l border-gray-800 max-h-screen overflow-y-auto">
        <div className="p-6">
          <UserProfile />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}