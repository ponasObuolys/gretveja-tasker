import { useDraggable } from "@dnd-kit/core";
import { format, isPast } from "date-fns";
import { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TaskComments } from "./TaskComments";
import { useState } from "react";
import { MessageCircle, Star } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
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

  const toggleComment = useMutation({
    mutationFn: async () => {
      console.log("Toggling comment for task:", task.id);
      const { data, error } = await supabase.rpc('toggle_comment', {
        task_id: task.id
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      console.log("Comment toggled successfully");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setShowComments(!showComments);
    },
    onError: (error) => {
      console.error("Error toggling comment:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko perjungti komentarų",
        variant: "destructive",
      });
    },
  });

  const isAdmin = profile?.role === "ADMIN";
  const isOverdue = task.deadline ? isPast(new Date(task.deadline)) : false;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-[#1A1D24] rounded-lg p-4 transition-colors",
        isSelectionMode ? "cursor-pointer" : "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 border-2 border-primary",
        task.is_commenting && "ring-2 ring-primary"
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

          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{task.created_by_profile?.email ?? "Unknown"}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleComment.mutate();
              }}
            >
              <MessageCircle className={cn(
                "h-4 w-4",
                showComments && "text-primary"
              )} />
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