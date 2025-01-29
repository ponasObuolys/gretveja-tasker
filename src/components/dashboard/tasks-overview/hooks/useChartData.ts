import { Tables } from "@/integrations/supabase/types";
import { format, subDays } from "date-fns";
import { useMemo, useCallback } from "react";
import { ChartDataPoint, TaskPeriod } from "../types";

export const useChartData = (
  tasks: Tables<"tasks">[] | undefined,
  selectedPeriod: TaskPeriod
): ChartDataPoint[] => {
  const groupTasksByDate = useCallback((tasks: Tables<"tasks">[]) => {
    return tasks.reduce((acc, task) => {
      const date = format(new Date(task.updated_at), 'MM-dd');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, []);

  const generateDataPoints = useCallback((
    tasksByDate: Record<string, number>,
    days: number
  ) => {
    const today = new Date();
    return Array.from({ length: days }, (_, i) => {
      const date = subDays(today, days - 1 - i);
      const formattedDate = format(date, 'MM-dd');
      return {
        date: formattedDate,
        tasks: tasksByDate[formattedDate] || 0
      };
    });
  }, []);

  return useMemo(() => {
    if (!tasks?.length) {
      return Array.from({ length: parseInt(selectedPeriod) }, (_, i) => ({
        date: format(subDays(new Date(), parseInt(selectedPeriod) - 1 - i), 'MM-dd'),
        tasks: 0
      }));
    }

    const tasksByDate = groupTasksByDate(tasks);
    const days = parseInt(selectedPeriod);
    return generateDataPoints(tasksByDate, days);
  }, [tasks, selectedPeriod, groupTasksByDate, generateDataPoints]);
};