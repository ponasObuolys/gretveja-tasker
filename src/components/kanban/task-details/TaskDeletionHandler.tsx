import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface TaskDeletionHandlerProps {
  taskId: string;
  onSuccess: () => void;
}

export const useTaskDeletion = ({ taskId, onSuccess }: TaskDeletionHandlerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    try {
      console.log("Starting task deletion process");

      // First, delete all notifications related to this task
      const { error: notificationsError } = await supabase
        .from("notifications")
        .delete()
        .eq("task_id", taskId)
        .throwOnError();

      if (notificationsError) {
        console.error("Error deleting task notifications:", notificationsError);
        throw notificationsError;
      }

      console.log("Task notifications deleted successfully");

      // Then, delete all task attachments
      const { error: attachmentsError } = await supabase
        .from("task_attachments")
        .delete()
        .eq("task_id", taskId)
        .throwOnError();

      if (attachmentsError) {
        console.error("Error deleting task attachments:", attachmentsError);
        throw attachmentsError;
      }

      console.log("Task attachments deleted successfully");

      // Then delete all task comments
      const { error: commentsError } = await supabase
        .from("task_comments")
        .delete()
        .eq("task_id", taskId)
        .throwOnError();

      if (commentsError) {
        console.error("Error deleting task comments:", commentsError);
        throw commentsError;
      }

      console.log("Task comments deleted successfully");

      // Finally delete the task
      const { error: taskError } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId)
        .throwOnError();

      if (taskError) {
        console.error("Error deleting task:", taskError);
        throw taskError;
      }

      console.log("Task deleted successfully");

      toast({
        title: "Užduotis ištrinta",
        description: "Užduotis sėkmingai ištrinta",
      });

      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onSuccess();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko ištrinti užduoties",
        variant: "destructive",
      });
    }
  };

  return { handleDelete };
};