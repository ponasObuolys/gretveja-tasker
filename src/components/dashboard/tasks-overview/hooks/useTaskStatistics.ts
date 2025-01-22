import { Tables } from "@/integrations/supabase/types";
import { useMemo } from "react";
import { TaskStatistics } from "../types";
import { differenceInDays } from "date-fns";

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

    const overdueTasks = tasks?.filter(task => {
      if (!task.deadline) return false;
      return new Date(task.deadline) < new Date() && task.status !== "IVYKDYTOS";
    }).length ?? 0;

    const totalTasks = tasks?.length ?? 0;
    const successRate = completedTasks + failedTasks > 0
      ? Math.round((completedTasks / (completedTasks + failedTasks)) * 100)
      : 0;
    
    const overdueRate = totalTasks > 0
      ? Math.round((overdueTasks / totalTasks) * 100)
      : 0;

    // Calculate average completion time for completed tasks
    const completionTimes = tasks
      ?.filter(task => task.status === "IVYKDYTOS")
      .map(task => {
        const start = new Date(task.created_at);
        const end = new Date(task.updated_at);
        return differenceInDays(end, start);
      }) ?? [];

    const avgCompletionDays = completionTimes.length > 0
      ? Math.round(completionTimes.reduce((sum, days) => sum + days, 0) / completionTimes.length)
      : 0;

    // Calculate priority distribution
    const priorityDistribution = {
      low: tasks?.filter(task => task.priority === 1).length ?? 0,
      medium: tasks?.filter(task => task.priority === 2).length ?? 0,
      high: tasks?.filter(task => task.priority >= 3).length ?? 0,
    };

    return {
      activeTasks,
      completedTasks,
      successRate,
      overdueRate,
      avgCompletionDays,
      priorityDistribution,
    };
  }, [tasks]);
};