import { useQuery } from "@tanstack/react-query";
import { KanbanColumn } from "./KanbanColumn";
import { supabase } from "@/integrations/supabase/client";
import { TaskFilter } from "../dashboard/DashboardLayout";
import { format } from "date-fns";
import { Tables } from "@/integrations/supabase/types";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { useState } from "react";
import { KanbanTask } from "./KanbanTask";
import { useToast } from "@/hooks/use-toast";

interface KanbanBoardProps {
  filter?: TaskFilter;
  showDeleteMode?: boolean;
}

type TaskWithProfile = Tables<"tasks"> & {
  profiles?: {
    email: string;
  } | null;
};

export function KanbanBoard({ filter = "all", showDeleteMode = false }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: tasks, isLoading, refetch } = useQuery({
    queryKey: ["tasks", filter],
    queryFn: async () => {
      console.log("Fetching tasks with filter:", filter);
      let query = supabase.from("tasks").select("*, profiles(email)");

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
      return data as TaskWithProfile[];
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const taskId = active.id.toString();
    const newStatus = over.id as Tables<"tasks">["status"];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("tasks")
        .update({ 
          status: newStatus,
          moved_by: user.id
        })
        .eq("id", taskId);

      if (error) throw error;

      toast({
        title: "Užduotis atnaujinta",
        description: "Užduoties statusas sėkmingai pakeistas",
      });

      refetch();
    } catch (error) {
      console.error("Error updating task status:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko atnaujinti užduoties statuso",
        variant: "destructive",
      });
    }

    setActiveId(null);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const columns: {
    title: string;
    id: Tables<"tasks">["status"];
    tasks: TaskWithProfile[];
  }[] = [
    {
      title: "Reikia padaryti",
      id: "REIKIA_PADARYTI",
      tasks: tasks?.filter((task) => task.status === "REIKIA_PADARYTI") ?? [],
    },
    {
      title: "Vykdoma",
      id: "VYKDOMA",
      tasks: tasks?.filter((task) => task.status === "VYKDOMA") ?? [],
    },
    {
      title: "Padaryta",
      id: "PADARYTA",
      tasks: tasks?.filter((task) => task.status === "PADARYTA") ?? [],
    },
    {
      title: "Atmesta",
      id: "ATMESTA",
      tasks: tasks?.filter((task) => task.status === "ATMESTA") ?? [],
    },
  ];

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            tasks={column.tasks}
            showDeleteMode={showDeleteMode}
          />
        ))}
      </div>
      <DragOverlay>
        {activeId && tasks ? (
          <KanbanTask 
            task={tasks.find((task) => task.id === activeId)!} 
            isDragging={true}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}