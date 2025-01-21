import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { RightSidebar } from "@/components/dashboard/RightSidebar";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { HandleBar } from "./HandleBar";
import { useDashboardLayout } from "./useDashboardLayout";

export function DashboardLayout() {
  const {
    activeTab,
    isMobileMenuOpen,
    selectedTasks,
    isSelectionMode,
    leftSidebarOpen,
    rightSidebarOpen,
    setActiveTab,
    setIsMobileMenuOpen,
    setSelectedTasks,
    setIsSelectionMode,
    setLeftSidebarOpen,
    setRightSidebarOpen,
    handleTaskSelect,
  } = useDashboardLayout();

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

  return (
    <NotificationProvider>
      <div className="flex min-h-screen bg-[#1A1D24] text-white">
        <MobileSidebar 
          isOpen={isMobileMenuOpen}
          onOpenChange={setIsMobileMenuOpen}
        />

        <div className={`relative transition-all duration-300 ease-in-out ${leftSidebarOpen ? 'w-64 min-w-64' : 'w-0'} border-r border-gray-800 max-h-screen overflow-hidden`}>
          <HandleBar
            isOpen={leftSidebarOpen}
            onToggle={() => setLeftSidebarOpen(!leftSidebarOpen)}
            position="left"
          />
          <div className="h-full">
            <DashboardSidebar />
          </div>
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

        <div className={`relative transition-all duration-300 ease-in-out ${rightSidebarOpen ? 'w-80 min-w-80' : 'w-0'} border-l border-gray-800 max-h-screen overflow-hidden`}>
          <HandleBar
            isOpen={rightSidebarOpen}
            onToggle={() => setRightSidebarOpen(!rightSidebarOpen)}
            position="right"
          />
          <div className="h-full">
            <RightSidebar />
          </div>
        </div>
      </div>
    </NotificationProvider>
  );
}