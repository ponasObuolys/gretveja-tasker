import { Tables } from "@/integrations/supabase/types";
import { useMemo } from "react";
import { TaskStatistics } from "../types";

export const useTaskStatistics = (tasks: Tables<"tasks">[] | undefined): TaskStatistics => {
  return useMemo(() => {
    const activeTasks = tasks?.filter(task => 
      task.status === "NAUJOS" || task.status === "VYKDOMOS"
    ).length ?? 0;

    const completedTasks = tasks?.filter(task => 
      task.status === "IVYKDYTOS"
    ).length ?? 0;

    const failedTasks = tasks?.filter(task => 
      task.status === "ATMESTOS"
    ).length ?? 0;

    const successRate = completedTasks + failedTasks > 0
      ? Math.round((completedTasks / (completedTasks + failedTasks)) * 100)
      : 0;

    return {
      activeTasks,
      completedTasks,
      successRate
    };
  }, [tasks]);
};