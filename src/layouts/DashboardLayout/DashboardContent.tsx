import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { TasksOverview } from "./components/TasksOverview";
import { TaskActions } from "./components/TaskActions";
import { TaskFilters } from "./components/TaskFilters";
import { TaskFilter } from "./types";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const Settings = lazy(() => import("@/pages/Settings"));
const KanbanBoard = lazy(() => import("@/components/kanban/KanbanBoard"));

interface DashboardContentProps {
  isAdmin: boolean;
  activeTab: TaskFilter;
  isSelectionMode: boolean;
  selectedTasks: string[];
  setActiveTab: (value: TaskFilter) => void;
  setIsSelectionMode: (value: boolean) => void;
  setSelectedTasks: (value: string[]) => void;
  handleTaskSelect: (taskId: string) => void;
}

export function DashboardContent({
  isAdmin,
  activeTab,
  isSelectionMode,
  selectedTasks,
  setActiveTab,
  setIsSelectionMode,
  setSelectedTasks,
  handleTaskSelect,
}: DashboardContentProps) {
  const DashboardView = () => (
    <div className="p-4 lg:p-6">
      <h2 className="text-xl lg:text-2xl font-semibold mb-6">Užduočių apžvalga</h2>
      
      <div className="hidden md:block mb-8">
        <TasksOverview />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <TaskActions
          isAdmin={isAdmin}
          isSelectionMode={isSelectionMode}
          selectedTasks={selectedTasks}
          setIsSelectionMode={setIsSelectionMode}
          setSelectedTasks={setSelectedTasks}
        />
        <TaskFilters onFilterChange={setActiveTab} />
      </div>

      <div className="flex-1 w-full">
        <Suspense fallback={<LoadingSpinner />}>
          <KanbanBoard 
            filter={activeTab} 
            isSelectionMode={isSelectionMode}
            selectedTasks={selectedTasks}
            onTaskSelect={handleTaskSelect}
          />
        </Suspense>
      </div>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<DashboardView />} />
      <Route path="/settings" element={
        <Suspense fallback={<LoadingSpinner />}>
          <Settings />
        </Suspense>
      } />
    </Routes>
  );
}