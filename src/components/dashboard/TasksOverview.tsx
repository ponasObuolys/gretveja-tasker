import { useState, useCallback } from "react";
import { TaskPeriod } from "./tasks-overview/types";
import { useTasksData } from "./tasks-overview/hooks/useTasksData";
import { useTaskStatistics } from "./tasks-overview/hooks/useTaskStatistics";
import { useChartData } from "./tasks-overview/hooks/useChartData";
import { StatCard } from "./tasks-overview/components/StatCard";
import { PeriodSelector } from "./tasks-overview/components/PeriodSelector";
import { TasksChart } from "./tasks-overview/components/TasksChart";
import { StatusPieChart } from "./tasks-overview/components/StatusPieChart";
import { PriorityDistribution } from "./tasks-overview/components/PriorityDistribution";

export function TasksOverview() {
  const [selectedPeriod, setSelectedPeriod] = useState<TaskPeriod>("7");
  const { data: tasks } = useTasksData(selectedPeriod);
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Aktyvios" 
          value={statistics.activeTasks} 
        />
        <StatCard 
          title="Atliktos" 
          value={statistics.completedTasks} 
        />
        <StatCard 
          title="Sėkmės rodiklis" 
          value={`${statistics.successRate}%`} 
        />
        <StatCard 
          title="Vėluojančios" 
          value={`${statistics.overdueRate}%`} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#1A1D24] p-4 rounded-lg">
          <h4 className="text-sm text-gray-400 mb-4">Užduočių būsenos</h4>
          <StatusPieChart data={tasks} />
        </div>
        <div className="bg-[#1A1D24] p-4 rounded-lg">
          <h4 className="text-sm text-gray-400 mb-4">Prioritetų pasiskirstymas</h4>
          <PriorityDistribution data={statistics.priorityDistribution} />
        </div>
      </div>

      <div className="bg-[#1A1D24] p-4 rounded-lg">
        <h4 className="text-sm text-gray-400 mb-4">Užduočių tendencijos</h4>
        <TasksChart data={chartData} />
      </div>
    </div>
  );
}