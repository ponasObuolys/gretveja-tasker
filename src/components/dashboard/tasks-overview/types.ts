import { Tables } from "@/integrations/supabase/types";

export type TaskPeriod = "7" | "30" | "90";

export interface TaskStatistics {
  activeTasks: number;
  completedTasks: number;
  successRate: number;
  overdueRate: number;
  avgCompletionDays: number;
  priorityDistribution: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface ChartDataPoint {
  date: string;
  tasks: number;
}

export interface PieChartData {
  name: string;
  value: number;
}

export interface StatCardProps {
  title: string;
  value: number | string;
  trend?: number;
}

export interface PeriodSelectorProps {
  selectedPeriod: TaskPeriod;
  onPeriodChange: (value: TaskPeriod) => void;
}

export interface TasksData {
  tasks: Tables<"tasks">[] | undefined;
  isLoading: boolean;
}