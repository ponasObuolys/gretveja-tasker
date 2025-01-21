export type TaskFilter = "all" | "recent" | "priority";

export interface SidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface HandleBarProps {
  isOpen: boolean;
  onToggle: () => void;
  position: 'left' | 'right';
}

export interface DashboardLayoutState {
  activeTab: TaskFilter;
  isMobileMenuOpen: boolean;
  selectedTasks: string[];
  isSelectionMode: boolean;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
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