import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { TaskComments } from "./TaskComments";
import { TaskHeader } from "./task-details/TaskHeader";
import { TaskAttachments } from "./task-details/TaskAttachments";
import { TaskStatusButtons } from "./task-details/TaskStatusButtons";
import { DeleteTaskDialog } from "./task-details/DeleteTaskDialog";
import { TaskAttachmentSection } from "./task-details/TaskAttachmentSection";
import { TaskDeleteButton } from "./task-details/TaskDeleteButton";

interface TaskDetailsModalProps {
  task: Tables<"tasks"> & {
    created_by_profile?: {
      email: string | null;
    } | null;
    moved_by_profile?: {
      email: string | null;
    } | null;
    task_attachments?: {
      id: string;
      file_name: string;
      file_url: string;
    }[];
  } | null;
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

export function TaskDetailsModal({ task, isOpen, onClose, isAdmin }: TaskDetailsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleStatusChange = async (newStatus: Tables<"tasks">["status"]) => {
    if (!task || !isAdmin) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", task.id);

      if (error) throw error;

      toast({
        title: "Būsena atnaujinta",
        description: "Užduoties būsena sėkmingai atnaujinta",
      });

      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (error) {
      console.error("Error updating task status:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko atnaujinti užduoties būsenos",
        variant: "destructive",
      });
    }
  };

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

  const handleDeleteFile = async (attachmentId: string) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from("task_attachments")
        .delete()
        .eq("id", attachmentId);

      if (error) throw error;

      toast({
        title: "Failas ištrintas",
        description: "Failas sėkmingai ištrintas",
      });

      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko ištrinti failo",
        variant: "destructive",
      });
    }
  };

  if (!task) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <DialogTitle className="text-xl">{task.title}</DialogTitle>
              <TaskDeleteButton
                isAdmin={isAdmin}
                onDelete={() => setIsDeleteDialogOpen(true)}
              />
            </div>
          </DialogHeader>

          <div className="space-y-6">
            <TaskHeader task={task} />

            {isAdmin && (
              <TaskAttachmentSection
                taskId={task.id}
                isAdmin={isAdmin}
              />
            )}

            <TaskAttachments
              isAdmin={isAdmin}
              attachments={task.task_attachments}
              onDeleteFile={handleDeleteFile}
              taskId={task.id}
            />

            <TaskStatusButtons
              isAdmin={isAdmin}
              currentStatus={task.status}
              onStatusChange={handleStatusChange}
            />

            <TaskComments taskId={task.id} isAdmin={isAdmin} />
          </div>
        </DialogContent>
      </Dialog>

      <DeleteTaskDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
      />
    </>
  );
}