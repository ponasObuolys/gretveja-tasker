import { useState } from "react";
import { TasksOverview } from "@/components/dashboard/TasksOverview";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { TaskActions } from "@/components/dashboard/TaskActions";
import { TaskFilters } from "@/components/dashboard/TaskFilters";
import { TaskFilter } from "@/components/dashboard/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function DashboardOverview() {
  const [activeTab, setActiveTab] = useState<TaskFilter>("all");
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
      return data;
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