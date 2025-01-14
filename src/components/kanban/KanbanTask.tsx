import { useDraggable } from "@dnd-kit/core";
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
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (taskId: string) => void;
}

export function KanbanTask({ 
  task,
  isSelectionMode = false,
  isSelected = false,
  onSelect
}: KanbanTaskProps) {
  const [showModal, setShowModal] = useState(false);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    disabled: isSelectionMode || task.is_commenting,
  });

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
    if (isDragging) return;
    
    if (isSelectionMode && onSelect) {
      onSelect(task.id);
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <div
        className={cn(
          "relative bg-[#1A1D24] rounded-lg p-4 transition-all duration-200 ease-in-out",
          "cursor-pointer hover:bg-[#242832] hover:border-[#FF4B6D] hover:border-2 border-solid",
          "z-10 pointer-events-auto",
          isDragging && "opacity-50 border-2 border-primary",
          task.is_commenting && "ring-2 ring-primary"
        )}
        onClick={handleClick}
      >
        <TaskDragHandle
          disabled={task.is_commenting}
          attributes={attributes}
          listeners={listeners}
          setNodeRef={setNodeRef}
        />

        <div className="relative z-10">
          <TaskContent
            task={task}
            isSelectionMode={isSelectionMode}
            isSelected={isSelected}
            onSelect={onSelect}
          />
        </div>
      </div>

      <TaskDetailsModal
        task={task}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        isAdmin={isAdmin}
      />
    </>
  );
}