import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { useState } from "react";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanTask } from "./KanbanTask";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { CreateTaskDialog } from "./CreateTaskDialog";

type TaskStatus = Tables<"tasks">["status"];

const statusColumns: { id: TaskStatus; title: string }[] = [
  { id: "REIKIA_PADARYTI", title: "Reikia padaryti" },
  { id: "VYKDOMA", title: "Vykdoma" },
  { id: "PADARYTA", title: "Padaryta" },
  { id: "ATMESTA", title: "Atmesta" },
];

export function KanbanBoard() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor));

  const { data: userProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (error) throw error;
      return data;
    },
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      console.log("Fetching tasks with creator information");
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          creator:profiles(email)
        `)
        .order("priority", { ascending: false });

      if (error) {
        console.error("Error fetching tasks:", error);
        throw error;
      }
      console.log("Fetched tasks:", data);
      return data;
    },
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({
      taskId,
      newStatus,
    }: {
      taskId: string;
      newStatus: TaskStatus;
    }) => {
      // Check if user is admin before attempting update
      if (userProfile?.role !== 'ADMIN') {
        throw new Error('Insufficient permissions');
      }

      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: "Užduotis atnaujinta",
        description: "Užduoties statusas sėkmingai pakeistas",
      });
    },
    onError: (error) => {
      console.error("Error updating task:", error);
      toast({
        title: "Negalima keisti užduoties",
        description: "Neturite teisių keisti užduotis. Jūs galite tik kurti naujas užduotis.",
        variant: "destructive",
      });
    },
  });

  function handleDragStart(event: DragStartEvent) {
    // Check permissions before allowing drag
    if (userProfile?.role !== 'ADMIN') {
      toast({
        title: "Negalima keisti užduoties",
        description: "Neturite teisių keisti užduotis. Jūs galite tik kurti naujas užduotis.",
        variant: "destructive",
      });
      return;
    }
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const newStatus = over.id as TaskStatus;
      updateTaskStatus.mutate({
        taskId: active.id as string,
        newStatus,
      });
    }
    
    setActiveId(null);
  }

  if (isLoading) {
    return <div className="p-8">Kraunama...</div>;
  }

  return (
    <>
      <div className="p-4">
        <CreateTaskDialog />
      </div>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 p-4 overflow-x-auto min-h-[calc(100vh-10rem)]">
          {statusColumns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={tasks?.filter((task) => task.status === column.id) || []}
            />
          ))}
        </div>
        <DragOverlay>
          {activeId && tasks ? (
            <KanbanTask
              task={tasks.find((task) => task.id === activeId)!}
              isDragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}