import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskFilter } from "./DashboardLayout";

interface TaskFiltersProps {
  onFilterChange: (value: TaskFilter) => void;
}

export function TaskFilters({ onFilterChange }: TaskFiltersProps) {
  return (
    <Tabs 
      defaultValue="all" 
      className="w-full sm:w-auto" 
      onValueChange={(value) => onFilterChange(value as TaskFilter)}
    >
      <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex gap-2">
        <TabsTrigger value="all" className="flex-1 sm:flex-none">Visos</TabsTrigger>
        <TabsTrigger value="recent" className="flex-1 sm:flex-none">Naujausios</TabsTrigger>
        <TabsTrigger value="priority" className="flex-1 sm:flex-none">Prioritetinės</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}