import { Tables } from "@/integrations/supabase/types";
import { format, subDays } from "date-fns";
import { useMemo } from "react";
import { ChartDataPoint, TaskPeriod } from "../types";

export const useChartData = (
  tasks: Tables<"tasks">[] | undefined,
  selectedPeriod: TaskPeriod
): ChartDataPoint[] => {
  return useMemo(() => {
    const data: ChartDataPoint[] = [];
    const today = new Date();
    const days = parseInt(selectedPeriod);

    // Group tasks by date
    const tasksByDate = tasks?.reduce((acc, task) => {
      const date = format(new Date(task.updated_at), 'MM-dd');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) ?? {};

    // Generate data points for the selected period
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const formattedDate = format(date, 'MM-dd');
      data.push({
        date: formattedDate,
        tasks: tasksByDate[formattedDate] || 0
      });
    }

    console.log("Generated chart data:", data);
    return data;
  }, [tasks, selectedPeriod]);
};