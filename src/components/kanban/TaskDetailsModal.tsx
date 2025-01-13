import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Star, Trash2 } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { TaskComments } from "./TaskComments";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface TaskDetailsModalProps {
  task: Tables<"tasks"> & {
    created_by_profile?: {
      email: string | null;
    } | null;
    moved_by_profile?: {
      email: string | null;
    } | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

export function TaskDetailsModal({ task, isOpen, onClose, isAdmin }: TaskDetailsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isOverdue = task?.deadline ? new Date(task.deadline) < new Date() : false;

  const handleDelete = async () => {
    if (!task || !isAdmin) return;

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

      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onClose();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko ištrinti užduoties",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (newStatus: Tables<"tasks">["status"]) => {
    if (!task || !isAdmin) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", task.id);

      if (error) throw error;

      toast({
        title: "Statusas atnaujintas",
        description: "Užduoties statusas sėkmingai atnaujintas",
      });

      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (error) {
      console.error("Error updating task status:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko atnaujinti užduoties statuso",
        variant: "destructive",
      });
    }
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-xl">{task.title}</DialogTitle>
            {isAdmin && (
              <Button
                variant="destructive"
                size="icon"
                onClick={handleDelete}
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {task.created_by_profile?.email ?? "Nežinomas"}
              </Badge>
              {task.deadline && (
                <Badge 
                  variant="secondary"
                  className={cn(
                    isOverdue && "bg-[#ff4b6e] text-white"
                  )}
                >
                  {format(new Date(task.deadline), "yyyy-MM-dd")}
                </Badge>
              )}
              {task.priority >= 3 && (
                <Star className="h-4 w-4 text-[#FFD700]" fill="#FFD700" />
              )}
            </div>

            <p className="text-gray-400 whitespace-pre-wrap">
              {task.description}
            </p>
          </div>

          {isAdmin && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={task.status === "REIKIA_PADARYTI" ? "default" : "outline"}
                onClick={() => handleStatusChange("REIKIA_PADARYTI")}
              >
                Reikia padaryti
              </Button>
              <Button
                variant={task.status === "VYKDOMA" ? "default" : "outline"}
                onClick={() => handleStatusChange("VYKDOMA")}
              >
                Vykdoma
              </Button>
              <Button
                variant={task.status === "PADARYTA" ? "default" : "outline"}
                onClick={() => handleStatusChange("PADARYTA")}
              >
                Padaryta
              </Button>
              <Button
                variant={task.status === "ATMESTA" ? "default" : "outline"}
                onClick={() => handleStatusChange("ATMESTA")}
              >
                Atmesta
              </Button>
            </div>
          )}

          <TaskComments taskId={task.id} isAdmin={isAdmin} />
        </div>
      </DialogContent>
    </Dialog>
  );
}