import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useId } from "react";
import { DeleteTaskDialog } from "./task-details/DeleteTaskDialog";
import { useTaskDeletion } from "./task-details/TaskDeletionHandler";
import { TaskDetailsContent } from "./task-details/TaskDetailsContent";

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
  const [isUploading, setIsUploading] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  const { handleDelete } = useTaskDeletion({
    taskId: task?.id || "",
    onSuccess: onClose,
  });

  const handleDialogClose = useCallback((open: boolean) => {
    if (!isUploading) {
      onClose();
    }
  }, [onClose, isUploading]);

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

      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (error) {
      console.error("Error updating task status:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko atnaujinti užduoties būsenos",
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

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["task-attachments"] })
      ]);
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
      <Dialog open={isOpen} onOpenChange={handleDialogClose}>
        <DialogContent 
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
        >
          <DialogHeader>
            <DialogTitle id={titleId} className="text-xl">
              {task.title}
            </DialogTitle>
          </DialogHeader>

          <div id={descriptionId}>
            <TaskDetailsContent
              task={task}
              isAdmin={isAdmin}
              isUploading={isUploading}
              onUploadStart={() => setIsUploading(true)}
              onUploadEnd={() => setIsUploading(false)}
              handleDeleteFile={handleDeleteFile}
              handleStatusChange={handleStatusChange}
              onDelete={() => setIsDeleteDialogOpen(true)}
            />
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