import { useState, useCallback } from "react";
import { TaskPeriod } from "./tasks-overview/types";
import { useTasksData } from "./tasks-overview/hooks/useTasksData";
import { useTaskStatistics } from "./tasks-overview/hooks/useTaskStatistics";
import { useChartData } from "./tasks-overview/hooks/useChartData";
import { StatCard } from "./tasks-overview/components/StatCard";
import { PeriodSelector } from "./tasks-overview/components/PeriodSelector";
import { TasksChart } from "./tasks-overview/components/TasksChart";

export function TasksOverview() {
  const [selectedPeriod, setSelectedPeriod] = useState<TaskPeriod>("7");
  const { data: tasks, isLoading } = useTasksData(selectedPeriod);
  const statistics = useTaskStatistics(tasks);
  const chartData = useChartData(tasks, selectedPeriod);

  const handlePeriodChange = useCallback((value: TaskPeriod) => {
    setSelectedPeriod(value);
  }, []);

  return (
    <div className="bg-[#242832] rounded-lg p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="text-lg font-medium">Užduočių statistika</h3>
        <PeriodSelector 
          selectedPeriod={selectedPeriod}
          onPeriodChange={handlePeriodChange}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Aktyvios" value={statistics.activeTasks} />
        <StatCard title="Atliktos" value={statistics.completedTasks} />
        <StatCard title="Sėkmės rodiklis" value={`${statistics.successRate}%`} />
      </div>

      <TasksChart 
        data={chartData} 
        isLoading={isLoading}
      />
    </div>
  );
}