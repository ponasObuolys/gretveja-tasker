import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KanbanColumn } from "./KanbanColumn";
import { TaskFilter } from "../dashboard/DashboardLayout";
import { Tables } from "@/integrations/supabase/types";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { useToast } from "@/hooks/use-toast";
import { KanbanLoading } from "./KanbanLoading";
import { fetchTasks, updateTaskStatus, TaskWithProfile } from "@/utils/taskUtils";

interface KanbanBoardProps {
  filter?: TaskFilter;
  isSelectionMode?: boolean;
  selectedTasks?: string[];
  onTaskSelect?: (taskId: string) => void;
}

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
    queryFn: () => fetchTasks(filter),
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ taskId, newStatus }: { taskId: string; newStatus: Tables<"tasks">["status"] }) => 
      updateTaskStatus(taskId, newStatus),
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
        description: error instanceof Error ? error.message : "Nepavyko atnaujinti užduoties statuso",
        variant: "destructive",
      });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as Tables<"tasks">["status"];
    
    updateTaskStatusMutation.mutate({ taskId, newStatus });
  };

  if (isLoading) {
    return <KanbanLoading />;
  }

  const columns: {
    title: string;
    id: Tables<"tasks">["status"];
    tasks: TaskWithProfile[];
  }[] = [
    {
      title: "Naujos",
      id: "NAUJOS",
      tasks: tasks?.filter((task) => task.status === "NAUJOS") ?? [],
    },
    {
      title: "Vykdomos",
      id: "VYKDOMOS",
      tasks: tasks?.filter((task) => task.status === "VYKDOMOS") ?? [],
    },
    {
      title: "Nukeltos",
      id: "NUKELTOS",
      tasks: tasks?.filter((task) => task.status === "NUKELTOS") ?? [],
    },
    {
      title: "Vėluojančios",
      id: "VELUOJANCIOS",
      tasks: tasks?.filter((task) => task.status === "VELUOJANCIOS") ?? [],
    },
    {
      title: "Įvykdytos",
      id: "IVYKDYTOS",
      tasks: tasks?.filter((task) => task.status === "IVYKDYTOS") ?? [],
    },
    {
      title: "Atmestos",
      id: "ATMESTOS",
      tasks: tasks?.filter((task) => task.status === "ATMESTOS") ?? [],
    },
  ];

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-6 gap-4 min-h-[calc(100vh-20rem)] w-full">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={`${column.title} (${column.tasks.length})`}
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