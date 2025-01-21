import { Draggable } from "@hello-pangea/dnd";
import { Tables } from "@/integrations/supabase/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { TaskDetailsModal } from "./TaskDetailsModal";
import { TaskContent } from "./TaskContent";
import { TaskDragHandle } from "./TaskDragHandle";

interface KanbanTaskProps {
  task: Tables<"tasks"> & {
    created_by_profile?: {
      email: string | null;
    } | null;
    moved_by_profile?: {
      email: string | null;
    } | null;
  };
  index: number;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (taskId: string) => void;
}

export function KanbanTask({ 
  task,
  index,
  isSelectionMode = false,
  isSelected = false,
  onSelect
}: KanbanTaskProps) {
  const [showModal, setShowModal] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      console.log("Fetching profile for task permissions");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }
      console.log("Fetched profile for task:", data);
      return data;
    },
  });

  const isAdmin = profile?.role === "ADMIN";

  const handleClick = (e: React.MouseEvent) => {
    console.log("Task clicked:", task.id);
    // Only handle click if it's directly on the task container
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.task-content')) {
      if (isSelectionMode && onSelect) {
        console.log("Selection mode - selecting task:", task.id);
        onSelect(task.id);
      } else {
        console.log("Opening task modal for:", task.id);
        setShowModal(true);
      }
    }
  };

  return (
    <>
      <Draggable 
        draggableId={task.id} 
        index={index}
        isDragDisabled={isSelectionMode || task.is_commenting}
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={cn(
              "relative bg-[#1A1D24] rounded-lg p-4 transition-all duration-200 ease-in-out",
              "cursor-pointer hover:bg-[#242832] hover:border-[#FF4B6D] hover:border-2 border-solid",
              "z-10 pointer-events-auto",
              snapshot.isDragging && "ring-2 ring-primary shadow-lg shadow-primary/20",
              task.is_commenting && "ring-2 ring-primary"
            )}
            onClick={handleClick}
          >
            <div {...provided.dragHandleProps}>
              <TaskDragHandle
                disabled={task.is_commenting}
              />
            </div>

            <TaskContent
              task={task}
              isSelectionMode={isSelectionMode}
              isSelected={isSelected}
              onSelect={onSelect}
            />
          </div>
        )}
      </Draggable>

      <TaskDetailsModal
        task={task}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        isAdmin={isAdmin}
      />
    </>
  );
}