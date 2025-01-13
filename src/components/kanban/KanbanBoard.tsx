import { useQuery } from "@tanstack/react-query";
import { KanbanColumn } from "./KanbanColumn";
import { supabase } from "@/integrations/supabase/client";
import { TaskFilter } from "../dashboard/DashboardLayout";
import { format } from "date-fns";

interface KanbanBoardProps {
  filter?: TaskFilter;
}

export function KanbanBoard({ filter = "all" }: KanbanBoardProps) {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", filter],
    queryFn: async () => {
      console.log("Fetching tasks with filter:", filter);
      let query = supabase.from("tasks").select("*");

      // Apply filters based on the selected tab
      if (filter === "priority") {
        query = query.gte("priority", 3);
      } else if (filter === "recent") {
        const today = format(new Date(), "yyyy-MM-dd");
        query = query.gte("created_at", `${today}T00:00:00Z`)
          .lte("created_at", `${today}T23:59:59Z`);
      }
      // "all" filter doesn't need any additional conditions

      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching tasks:", error);
        throw error;
      }

      console.log("Fetched tasks:", data);
      return data;
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const columns = [
    {
      title: "Reikia padaryti",
      status: "REIKIA_PADARYTI",
      tasks: tasks?.filter((task) => task.status === "REIKIA_PADARYTI") ?? [],
    },
    {
      title: "Vykdoma",
      status: "VYKDOMA",
      tasks: tasks?.filter((task) => task.status === "VYKDOMA") ?? [],
    },
    {
      title: "Padaryta",
      status: "PADARYTA",
      tasks: tasks?.filter((task) => task.status === "PADARYTA") ?? [],
    },
    {
      title: "Atmesta",
      status: "ATMESTA",
      tasks: tasks?.filter((task) => task.status === "ATMESTA") ?? [],
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((column) => (
        <KanbanColumn
          key={column.status}
          title={column.title}
          status={column.status as any}
          tasks={column.tasks}
        />
      ))}
    </div>
  );
}