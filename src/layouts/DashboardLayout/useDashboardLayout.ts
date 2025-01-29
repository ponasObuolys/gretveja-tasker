import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TaskFilter } from "@/components/dashboard/DashboardLayout";
import { Tables } from "@/integrations/supabase/types";
import * as Sentry from "@sentry/react";

const SIDEBAR_STATE_KEY = "dashboard_sidebar_state";
const PROFILE_GC_TIME = 1000 * 60 * 30; // 30 minutes
const PROFILE_STALE_TIME = 1000 * 60 * 5; // 5 minutes

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
  const queryClient = useQueryClient();
  const mountedRef = useRef(true);

  const { data: profile, error: profileError, isError } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No user found");
        
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
          
        if (error) throw error;
        return data as Tables<"profiles">;
      } catch (error) {
        Sentry.captureException(error);
        throw error;
      }
    },
    staleTime: PROFILE_STALE_TIME,
    gcTime: PROFILE_GC_TIME,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * (2 ** attemptIndex), 10000),
  });

  useEffect(() => {
    if (isError && mountedRef.current) {
      toast({
        title: "Error loading profile",
        description: profileError?.message || "An error occurred",
        variant: "destructive",
      });
    }
  }, [isError, profileError, toast]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      // Clear any pending queries
      queryClient.cancelQueries({ queryKey: ["profile"] });
      // Clear local storage listeners
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [queryClient]);

  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === `${SIDEBAR_STATE_KEY}_left`) {
      setLeftSidebarOpen(e.newValue ? JSON.parse(e.newValue) : true);
    } else if (e.key === `${SIDEBAR_STATE_KEY}_right`) {
      setRightSidebarOpen(e.newValue ? JSON.parse(e.newValue) : true);
    }
  };

  useEffect(() => {
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    if (mountedRef.current) {
      localStorage.setItem(`${SIDEBAR_STATE_KEY}_left`, JSON.stringify(leftSidebarOpen));
    }
  }, [leftSidebarOpen]);

  useEffect(() => {
    if (mountedRef.current) {
      localStorage.setItem(`${SIDEBAR_STATE_KEY}_right`, JSON.stringify(rightSidebarOpen));
    }
  }, [rightSidebarOpen]);

  const handleTaskSelect = (taskId: string) => {
    if (!mountedRef.current) return;
    setSelectedTasks(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      } else {
        return [...prev, taskId];
      }
    });
  };

  const isAdmin = profile?.role === "ADMIN";

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