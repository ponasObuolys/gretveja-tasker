import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { TaskFilter } from "@/components/dashboard/DashboardLayout";
import { DashboardLayoutState, DashboardLayoutActions } from "./types";

const SIDEBAR_STATE_KEY = "dashboard_sidebar_state";

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
    // State
    activeTab,
    isMobileMenuOpen,
    selectedTasks,
    isSelectionMode,
    leftSidebarOpen,
    rightSidebarOpen,
    // Actions
    setActiveTab,
    setIsMobileMenuOpen,
    setSelectedTasks,
    setIsSelectionMode,
    setLeftSidebarOpen,
    setRightSidebarOpen,
    handleTaskSelect,
  };
}