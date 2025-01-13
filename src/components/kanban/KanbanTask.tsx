import { useDraggable } from "@dnd-kit/core";
import { format, isPast } from "date-fns";
import { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { TaskDetailsModal } from "./TaskDetailsModal";
import { Checkbox } from "@/components/ui/checkbox";

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
  const isOverdue = task.deadline ? isPast(new Date(task.deadline)) : false;

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click when dragging
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
          "relative bg-[#1A1D24] rounded-lg p-4 transition-colors",
          "cursor-pointer hover:bg-[#242832]",
          "z-10 pointer-events-auto",
          isDragging && "opacity-50 border-2 border-primary",
          task.is_commenting && "ring-2 ring-primary"
        )}
        onClick={handleClick}
      >
        {/* Drag Handle Area */}
        <div
          ref={setNodeRef}
          {...(task.is_commenting ? {} : { ...attributes, ...listeners })}
          className="absolute inset-0 z-9"
          onClick={(e) => e.stopPropagation()}
        />

        <div className="relative z-10">
          <div className="flex items-start gap-2">
            {isSelectionMode && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onSelect?.(task.id)}
                className="mt-1"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <div className="flex-1 space-y-3">
              <div className="space-y-2">
                <h4 className="text-base font-bold leading-tight">{task.title}</h4>
                {task.description && (
                  <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                    {task.description}
                  </p>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {task.deadline && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-xs",
                      isOverdue && "bg-[#ff4b6e] text-white"
                    )}
                  >
                    {format(new Date(task.deadline), "MM-dd")}
                  </Badge>
                )}
                {task.priority >= 3 && (
                  <Star className="h-4 w-4 text-[#FFD700]" fill="#FFD700" />
                )}
              </div>

              <div className="text-xs text-gray-400">
                {task.created_by_profile?.email ?? "Unknown"}
              </div>
            </div>
          </div>
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