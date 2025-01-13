import { useDraggable } from "@dnd-kit/core";
import { format } from "date-fns";
import { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TaskComments } from "./TaskComments";
import { useState } from "react";
import { MessageCircle, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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
  const [showComments, setShowComments] = useState(false);
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: task.id,
    disabled: isSelectionMode,
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

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-[#1A1D24] rounded-lg p-4",
        isSelectionMode ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
      )}
      onClick={() => {
        if (isSelectionMode && onSelect) {
          onSelect(task.id);
        }
      }}
    >
      <div className="flex items-start gap-2">
        {isSelectionMode && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect?.(task.id)}
            className="mt-1"
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
              <Badge variant="secondary" className="text-xs">
                {format(new Date(task.deadline), "MM-dd")}
              </Badge>
            )}
            {task.priority >= 3 && (
              <Star className="h-4 w-4 text-[#FFD700]" fill="#FFD700" />
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{task.created_by_profile?.email ?? "Unknown"}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setShowComments(!showComments);
              }}
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>

          {showComments && (
            <TaskComments taskId={task.id} isAdmin={isAdmin} />
          )}
        </div>
      </div>
    </div>
  );
}