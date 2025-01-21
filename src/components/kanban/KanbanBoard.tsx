import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KanbanColumn } from "./KanbanColumn";
import { TaskFilter } from "../dashboard/DashboardLayout";
import { Tables } from "@/integrations/supabase/types";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { useToast } from "@/hooks/use-toast";
import { KanbanLoading } from "./KanbanLoading";
import { fetchTasks, updateTaskStatus, TaskWithProfile } from "@/utils/taskUtils";
import { isPast } from "date-fns";
import { useEffect } from "react";
import { useSearchStore } from "@/stores/searchStore";
import { supabase } from "@/integrations/supabase/client";

interface KanbanBoardProps {
  filter?: TaskFilter;
  isSelectionMode?: boolean;
  selectedTasks?: string[];
  onTaskSelect?: (taskId: string) => void;
}

const TERMINAL_STATUSES = ["IVYKDYTOS", "ATMESTOS"] as const;
const DELAYED_STATUS = "VELUOJANCIOS";

export function KanbanBoard({
  filter = "all",
  isSelectionMode = false,
  selectedTasks = [],
  onTaskSelect
}: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { searchQuery } = useSearchStore();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", filter, searchQuery],
    queryFn: () => fetchTasks(filter, searchQuery),
  });

  const sendEmailNotification = async (taskId: string, type: "new_task" | "task_completed") => {
    try {
      const { error } = await supabase.functions.invoke("send-email", {
        body: { type, taskId },
      });

      if (error) {
        console.error("Error sending email notification:", error);
      }
    } catch (error) {
      console.error("Error invoking send-email function:", error);
    }
  };

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: Tables<"tasks">["status"] }) => {
      await updateTaskStatus(taskId, newStatus);
      
      // Send email notification when task is completed
      if (newStatus === "IVYKDYTOS") {
        await sendEmailNotification(taskId, "task_completed");
      }
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
        description: error instanceof Error ? error.message : "Nepavyko atnaujinti užduoties statuso",
        variant: "destructive",
      });
    },
  });

  // Check for overdue tasks and move them to VELUOJANCIOS
  useEffect(() => {
    if (!tasks) return;

    const now = new Date();
    
    tasks.forEach(task => {
      if (TERMINAL_STATUSES.includes(task.status as typeof TERMINAL_STATUSES[number])) {
        return;
      }

      if (
        task.deadline && 
        isPast(new Date(task.deadline)) && 
        task.status !== DELAYED_STATUS
      ) {
        console.log(`Moving overdue task ${task.id} to VELUOJANCIOS`);
        updateTaskStatusMutation.mutate({ 
          taskId: task.id, 
          newStatus: DELAYED_STATUS 
        });
      }
    });
  }, [tasks]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as Tables<"tasks">["status"];
    updateTaskStatusMutation.mutate({ taskId: draggableId, newStatus });
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
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 min-h-[calc(100vh-14rem)] w-full overflow-x-auto p-2">
        {columns.map((column) => (
          <Droppable key={column.id} droppableId={column.id}>
            {(provided, snapshot) => (
              <KanbanColumn
                id={column.id}
                title={`${column.title} (${column.tasks.length})`}
                tasks={column.tasks}
                isSelectionMode={isSelectionMode}
                selectedTasks={selectedTasks}
                onTaskSelect={onTaskSelect}
                provided={provided}
                isDraggingOver={snapshot.isDraggingOver}
              />
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}