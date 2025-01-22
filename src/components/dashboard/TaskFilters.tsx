import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskFilter } from "./DashboardLayout";

interface TaskFiltersProps {
  onFilterChange: (value: TaskFilter) => void;
}

export function TaskFilters({ onFilterChange }: TaskFiltersProps) {
  return (
    <Tabs 
      defaultValue="all" 
      className="w-full" 
      onValueChange={(value) => onFilterChange(value as TaskFilter)}
    >
      <TabsList className="w-full grid grid-cols-3 gap-1 p-1 h-auto bg-secondary/50">
        <TabsTrigger 
          value="all" 
          className="min-h-[44px] data-[state=active]:bg-primary"
        >
          Visos
        </TabsTrigger>
        <TabsTrigger 
          value="recent" 
          className="min-h-[44px] data-[state=active]:bg-primary"
        >
          Naujausios
        </TabsTrigger>
        <TabsTrigger 
          value="priority" 
          className="min-h-[44px] data-[state=active]:bg-primary"
        >
          Prioritetinės
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}