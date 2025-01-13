import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TaskComments } from "./TaskComments";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
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

  const style = transform ? {
    transform: CSS.Transform.toString(transform),
  } : undefined;

  const priorityColor = task.priority && task.priority >= 3 ? "destructive" : "default";
  const deadlineColor = task.deadline && new Date(task.deadline) < new Date() ? "destructive" : "default";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-[#1A1D24] rounded-lg p-4 cursor-grab active:cursor-grabbing ${isSelectionMode ? 'cursor-pointer' : ''}`}
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
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium leading-none">{task.title}</h4>
            <div className="flex gap-1">
              {task.priority && (
                <Badge variant={priorityColor}>P{task.priority}</Badge>
              )}
              {task.deadline && (
                <Badge variant={deadlineColor}>
                  {format(new Date(task.deadline), "MM-dd")}
                </Badge>
              )}
            </div>
          </div>
          {task.description && (
            <p className="text-sm text-gray-400">{task.description}</p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {task.created_by_profile?.email ?? "Unknown"}
            </span>
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