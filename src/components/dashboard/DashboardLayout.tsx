import { useState } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { MobileSidebar } from "./MobileSidebar";
import { RightSidebar } from "./RightSidebar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { DashboardContent } from "./DashboardContent";
import { NotificationProvider } from "@/contexts/NotificationContext";

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
    <NotificationProvider>
      <div className="flex min-h-screen bg-[#1A1D24] text-white">
        {/* Mobile Sidebar */}
        <MobileSidebar 
          isOpen={isMobileMenuOpen}
          onOpenChange={setIsMobileMenuOpen}
        />

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

        <RightSidebar />
      </div>
    </NotificationProvider>
  );
}