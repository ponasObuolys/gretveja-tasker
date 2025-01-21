import { create } from "zustand";
import { TaskWithProfile } from "@/utils/taskUtils";
import { TaskFilter } from "@/components/dashboard/DashboardLayout";

interface TasksState {
  tasks: TaskWithProfile[];
  filter: TaskFilter;
  searchQuery: string;
  selectedTasks: string[];
  setTasks: (tasks: TaskWithProfile[]) => void;
  setFilter: (filter: TaskFilter) => void;
  setSearchQuery: (query: string) => void;
  toggleTaskSelection: (taskId: string) => void;
  clearSelectedTasks: () => void;
}

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],
  filter: "all",
  searchQuery: "",
  selectedTasks: [],
  setTasks: (tasks) => set({ tasks }),
  setFilter: (filter) => set({ filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleTaskSelection: (taskId) =>
    set((state) => ({
      selectedTasks: state.selectedTasks.includes(taskId)
        ? state.selectedTasks.filter((id) => id !== taskId)
        : [...state.selectedTasks, taskId],
    })),
  clearSelectedTasks: () => set({ selectedTasks: [] }),
}));

// Selectors
export const useFilteredTasks = () => {
  return useTasksStore((state) => {
    const { tasks, filter, searchQuery } = state;
    let filteredTasks = tasks;

    if (searchQuery) {
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    switch (filter) {
      case "priority":
        return filteredTasks.filter((task) => task.priority >= 3);
      case "recent":
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return filteredTasks.filter(
          (task) => new Date(task.created_at) >= today
        );
      default:
        return filteredTasks;
    }
  });
};