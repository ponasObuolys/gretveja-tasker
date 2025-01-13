import { Card } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { lt } from "date-fns/locale";
import { useState } from "react";
import { TaskComments } from "./TaskComments";
import { Button } from "@/components/ui/button";
import { MessageCircle, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface KanbanTaskProps {
  task: Tables<"tasks"> & {
    profiles?: {
      email: string;
    };
  };
  isDragging?: boolean;
  showDeleteMode?: boolean;
}

export function KanbanTask({ task, isDragging, showDeleteMode }: KanbanTaskProps) {
  const [showComments, setShowComments] = useState(false);
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });
  const { toast } = useToast();

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

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", task.id);

      if (error) throw error;

      toast({
        title: "Užduotis ištrinta",
        description: "Užduotis sėkmingai ištrinta",
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko ištrinti užduoties",
        variant: "destructive",
      });
    }
  };

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-4 cursor-grab active:cursor-grabbing hover:bg-accent transition-colors relative",
        isDragging && "opacity-50"
      )}
      {...listeners}
      {...attributes}
    >
      {showDeleteMode && userProfile?.role === "ADMIN" && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      <div className="flex gap-2 mb-2">
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-[#E6F3FF] text-[#000000]">
          Užduotis
        </span>
        {task.priority > 2 && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-[#FF0000] text-[#FFFFFF]">
            SVARBI UŽDUOTIS
          </span>
        )}
      </div>
      <div className="font-medium">{task.title}</div>
      {task.description && (
        <div className="mt-2 text-sm text-muted-foreground">
          {task.description}
        </div>
      )}
      <div className="mt-2 text-sm text-muted-foreground">
        Prioritetas: {task.priority}
      </div>
      <div className="mt-2 text-sm text-muted-foreground">
        Sukūrė: {task.profiles?.email || "Nežinomas vartotojas"}
      </div>
      {task.deadline && (
        <div className="mt-2 text-sm text-muted-foreground">
          Terminas: {format(new Date(task.deadline), "PPP", { locale: lt })}
        </div>
      )}
      
      <div className="mt-4 border-t pt-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          {showComments ? "Slėpti komentarus" : "Rodyti komentarus"}
        </Button>
        
        {showComments && (
          <TaskComments
            taskId={task.id}
            isAdmin={userProfile?.role === "ADMIN"}
          />
        )}
      </div>
    </Card>
  );
}