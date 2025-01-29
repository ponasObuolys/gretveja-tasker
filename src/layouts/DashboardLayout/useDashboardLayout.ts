import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TaskFilter } from "@/components/dashboard/DashboardLayout";
import { Tables } from "@/integrations/supabase/types";

const SIDEBAR_STATE_KEY = "dashboard_sidebar_state";

export interface DashboardLayoutState {
  activeTab: TaskFilter;
  isMobileMenuOpen: boolean;
  selectedTasks: string[];
  isSelectionMode: boolean;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  profile: Tables<"profiles"> | null;
  isAdmin: boolean;
}

export interface DashboardLayoutActions {
  setActiveTab: (value: TaskFilter) => void;
  setIsMobileMenuOpen: (value: boolean) => void;
  setSelectedTasks: (value: string[]) => void;
  setIsSelectionMode: (value: boolean) => void;
  setLeftSidebarOpen: (value: boolean) => void;
  setRightSidebarOpen: (value: boolean) => void;
  handleTaskSelect: (taskId: string) => void;
}

export function useDashboardLayout(): DashboardLayoutState & DashboardLayoutActions {
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

  const { data: profile, error: profileError, isError } = useQuery({
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
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    cacheTime: 1000 * 60 * 10, // Keep cache for 10 minutes
  });

  useEffect(() => {
    if (isError) {
      toast({
        title: "Error loading profile",
        description: profileError?.message || "An error occurred",
        variant: "destructive",
      });
    }
  }, [isError, profileError, toast]);

  useEffect(() => {
    return () => {
      // Perform any necessary cleanup here
      console.log("Cleaning up DashboardLayout state");
    };
  }, []);

  const isAdmin = profile?.role === "ADMIN";

  useEffect(() => {
    localStorage.setItem(`${SIDEBAR_STATE_KEY}_left`, JSON.stringify(leftSidebarOpen));
  }, [leftSidebarOpen]);

  useEffect(() => {
    localStorage.setItem(`${SIDEBAR_STATE_KEY}_right`, JSON.stringify(rightSidebarOpen));
  }, [rightSidebarOpen]);

  const handleTaskSelect = (taskId: string) => {
    setSelectedTasks(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      } else {
        return [...prev, taskId];
      }
    });
  };

  return {
    activeTab,
    isMobileMenuOpen,
    selectedTasks,
    isSelectionMode,
    leftSidebarOpen,
    rightSidebarOpen,
    profile,
    isAdmin,
    setActiveTab,
    setIsMobileMenuOpen,
    setSelectedTasks,
    setIsSelectionMode,
    setLeftSidebarOpen,
    setRightSidebarOpen,
    handleTaskSelect,
  };
}