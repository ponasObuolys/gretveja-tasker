import { Draggable } from "@hello-pangea/dnd";
import { Tables } from "@/integrations/supabase/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { TaskDetailsModal } from "./TaskDetailsModal";
import { TaskContent } from "./TaskContent";
import { TaskDragHandle } from "./TaskDragHandle";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  const { data: profile } = useQuery({
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

  const isAdmin = profile?.role === "ADMIN";

  const handleClick = (e: React.MouseEvent) => {
    if (isSelectionMode && onSelect) {
      onSelect(task.id);
    } else {
      setShowModal(true);
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
            {...provided.dragHandleProps}
            className={cn(
              "relative bg-[#1A1D24] rounded-lg p-4 transition-all duration-200 ease-in-out",
              "cursor-pointer hover:bg-[#242832] hover:border-[#FF4B6D] hover:border-2 border-solid",
              "z-10 pointer-events-auto",
              snapshot.isDragging && "ring-2 ring-primary shadow-lg shadow-primary/20",
              task.is_commenting && "ring-2 ring-primary"
            )}
            onClick={handleClick}
          >
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