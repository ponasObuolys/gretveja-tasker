import { TasksOverview } from "./TasksOverview";
import { KanbanBoard } from "../kanban/KanbanBoard";
import { TaskActions } from "./TaskActions";
import { TaskFilters } from "./TaskFilters";
import { TaskFilter } from "./DashboardLayout";

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
  return (
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
        <KanbanBoard 
          filter={activeTab} 
          isSelectionMode={isSelectionMode}
          selectedTasks={selectedTasks}
          onTaskSelect={handleTaskSelect}
        />
      </div>
    </div>
  );
}