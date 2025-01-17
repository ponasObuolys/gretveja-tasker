import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { TaskComments } from "./TaskComments";
import { TaskActions } from "./task-details/TaskActions";
import { TaskHeader } from "./task-details/TaskHeader";
import { TaskAttachments } from "./task-details/TaskAttachments";
import { TaskStatusButtons } from "./task-details/TaskStatusButtons";
import { DeleteTaskDialog } from "./task-details/DeleteTaskDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LinkIcon, PaperclipIcon, Loader2 } from "lucide-react";

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
  const [newLink, setNewLink] = useState("");

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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!task || !isAdmin || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const filePath = `${task.id}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("task_attachments")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("task_attachments")
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from("task_attachments")
          .insert({
            task_id: task.id,
            file_name: file.name,
            file_url: publicUrl,
          });

        if (dbError) throw dbError;
      }

      toast({
        title: "Failai įkelti",
        description: "Failai sėkmingai įkelti prie užduoties",
      });

      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (error) {
      console.error("Error uploading files:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko įkelti failų",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddLink = async () => {
    if (!task || !isAdmin || !newLink) return;

    try {
      const { error } = await supabase
        .from("task_links")
        .insert({
          task_id: task.id,
          url: newLink,
        });

      if (error) throw error;

      toast({
        title: "Nuoroda pridėta",
        description: "Nuoroda sėkmingai pridėta prie užduoties",
      });

      setNewLink("");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (error) {
      console.error("Error adding link:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko pridėti nuorodos",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFile = async (attachmentId: string) => {
    if (!task || !isAdmin) return;

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

  if (!task) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <DialogTitle className="text-xl">{task.title}</DialogTitle>
              <TaskActions
                isAdmin={isAdmin}
                onDelete={() => setIsDeleteDialogOpen(true)}
              />
            </div>
          </DialogHeader>

          <div className="space-y-6">
            <TaskHeader task={task} />

            {isAdmin && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="relative flex-1"
                    disabled={isUploading}
                  >
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                    />
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <PaperclipIcon className="h-4 w-4 mr-2" />
                    )}
                    {isUploading ? "Įkeliama..." : "Prisegti failus"}
                  </Button>
                  <div className="flex gap-2 flex-1">
                    <Input
                      type="url"
                      placeholder="Įvesti nuorodą..."
                      value={newLink}
                      onChange={(e) => setNewLink(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      onClick={handleAddLink}
                      disabled={!newLink}
                    >
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
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