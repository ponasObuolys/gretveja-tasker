import { useState, useEffect } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { MobileSidebar } from "./MobileSidebar";
import { RightSidebar } from "./RightSidebar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { DashboardContent } from "./DashboardContent";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export type TaskFilter = "all" | "recent" | "priority";

const SIDEBAR_STATE_KEY = "dashboard_sidebar_state";

export function DashboardLayout() {
  const [activeTab, setActiveTab] = useState<TaskFilter>("all");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(() => {
    const saved = localStorage.getItem(`${SIDEBAR_STATE_KEY}_left`);
    return saved ? JSON.parse(saved) : true;
  });
  const [rightSidebarOpen, setRightSidebarOpen] = useState(() => {
    const saved = localStorage.getItem(`${SIDEBAR_STATE_KEY}_right`);
    return saved ? JSON.parse(saved) : true;
  });
  const { toast } = useToast();

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

  useEffect(() => {
    localStorage.setItem(`${SIDEBAR_STATE_KEY}_left`, JSON.stringify(leftSidebarOpen));
  }, [leftSidebarOpen]);

  useEffect(() => {
    localStorage.setItem(`${SIDEBAR_STATE_KEY}_right`, JSON.stringify(rightSidebarOpen));
  }, [rightSidebarOpen]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '[') {
          e.preventDefault();
          setLeftSidebarOpen(prev => !prev);
          toast({
            title: leftSidebarOpen ? "Kairysis šoninis meniu uždaromas" : "Kairysis šoninis meniu atidaromas",
            duration: 1500
          });
        } else if (e.key === ']') {
          e.preventDefault();
          setRightSidebarOpen(prev => !prev);
          toast({
            title: rightSidebarOpen ? "Dešinysis šoninis meniu uždaromas" : "Dešinysis šoninis meniu atidaromas",
            duration: 1500
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [leftSidebarOpen, rightSidebarOpen, toast]);

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

        {/* Left Sidebar with Toggle */}
        <div className={`relative transition-all duration-300 ease-in-out ${leftSidebarOpen ? 'w-64 min-w-64' : 'w-0'} border-r border-gray-800 max-h-screen overflow-hidden`}>
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-50 bg-background/50 backdrop-blur-sm hidden lg:flex"
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
          >
            {leftSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
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

        {/* Right Sidebar with Toggle */}
        <div className={`relative transition-all duration-300 ease-in-out ${rightSidebarOpen ? 'w-80 min-w-80' : 'w-0'} border-l border-gray-800 max-h-screen overflow-hidden`}>
          <Button
            variant="ghost"
            size="icon"
            className="absolute -left-4 top-1/2 transform -translate-y-1/2 z-50 bg-background/50 backdrop-blur-sm hidden xl:flex"
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
          >
            {rightSidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          <div className="h-full">
            <RightSidebar />
          </div>
        </div>
      </div>
    </NotificationProvider>
  );
}