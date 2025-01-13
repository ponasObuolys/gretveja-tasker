import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KanbanColumn } from "./KanbanColumn";
import { supabase } from "@/integrations/supabase/client";
import { TaskFilter } from "../dashboard/DashboardLayout";
import { format } from "date-fns";
import { Tables } from "@/integrations/supabase/types";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { useToast } from "@/hooks/use-toast";

interface KanbanBoardProps {
  filter?: TaskFilter;
  isSelectionMode?: boolean;
  selectedTasks?: string[];
  onTaskSelect?: (taskId: string) => void;
}

type TaskWithProfile = Tables<"tasks"> & {
  profiles?: {
    email: string | null;
  } | null;
};

export function KanbanBoard({ 
  filter = "all", 
  isSelectionMode = false,
  selectedTasks = [],
  onTaskSelect
}: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", filter],
    queryFn: async () => {
      console.log("Fetching tasks with filter:", filter);
      let query = supabase
        .from("tasks")
        .select(`
          *,
          profiles (
            email
          )
        `);

      if (filter === "priority") {
        query = query.gte("priority", 3);
      } else if (filter === "recent") {
        const today = format(new Date(), "yyyy-MM-dd");
        query = query.gte("created_at", `${today}T00:00:00Z`)
          .lte("created_at", `${today}T23:59:59Z`);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching tasks:", error);
        throw error;
      }

      console.log("Fetched tasks:", data);
      return (data || []) as unknown as TaskWithProfile[];
    },
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: Tables<"tasks">["status"] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { error } = await supabase
        .from("tasks")
        .update({ 
          status: newStatus,
          moved_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: "Užduoties statusas atnaujintas",
        description: "Užduotis sėkmingai perkelta į kitą stulpelį",
      });
    },
    onError: (error) => {
      console.error("Error updating task status:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko atnaujinti užduoties statuso",
        variant: "destructive",
      });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as Tables<"tasks">["status"];
    const task = tasks?.find(t => t.id === taskId);
    
    if (!task) return;

    // Validate allowed transitions
    const isValidTransition = (
      (task.status === "REIKIA_PADARYTI" && newStatus === "VYKDOMA") ||
      (task.status === "VYKDOMA" && (newStatus === "PADARYTA" || newStatus === "ATMESTA"))
    );

    if (!isValidTransition) {
      toast({
        title: "Negalimas veiksmas",
        description: "Šis statusas negalimas šiai užduočiai",
        variant: "destructive",
      });
      return;
    }

    updateTaskStatus.mutate({ taskId, newStatus });
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
    <DndContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            tasks={column.tasks}
            isSelectionMode={isSelectionMode}
            selectedTasks={selectedTasks}
            onTaskSelect={onTaskSelect}
          />
        ))}
      </div>
    </DndContext>
  );
}