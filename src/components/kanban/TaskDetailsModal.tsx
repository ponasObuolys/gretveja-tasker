import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Star, Trash2, FileText, X } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { TaskComments } from "./TaskComments";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const isOverdue = task?.deadline ? new Date(task.deadline) < new Date() : false;

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

        const { error: dbError } = await supabase
          .from("task_attachments")
          .insert({
            task_id: task.id,
            file_name: file.name,
            file_url: filePath,
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
    <>
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <DialogTitle className="text-xl">{task.title}</DialogTitle>
              {isAdmin && (
                <div className="modal-actions">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="delete-button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
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

              {isAdmin && (
                <div className="attachment-section">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="relative"
                      disabled={isUploading}
                    >
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept="*/*"
                      />
                      <FileText className="h-4 w-4 mr-2" />
                      {isUploading ? "Įkeliama..." : "Prisegti failus"}
                    </Button>
                  </div>
                  
                  <div className="attached-files">
                    {task.attachments?.map((attachment: any) => (
                      <div key={attachment.id} className="file-item">
                        <span className="text-sm truncate block">{attachment.file_name}</span>
                        {isAdmin && (
                          <Button
                            variant="destructive"
                            size="icon"
                            className="delete-file"
                            onClick={() => handleDeleteFile(attachment.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ar tikrai norite ištrinti šią užduotį?</AlertDialogTitle>
            <AlertDialogDescription>
              Šis veiksmas negrįžtamas. Užduotis bus ištrinta visam laikui.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Atšaukti</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Ištrinti</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}