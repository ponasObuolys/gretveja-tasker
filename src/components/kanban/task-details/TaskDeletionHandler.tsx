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
      console.log("Starting task deletion process for task:", taskId);

      const { error: taskError } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId)
        .throwOnError();

      if (taskError) {
        console.error("Error deleting task:", taskError);
        throw taskError;
      }

      console.log("Task and related records deleted successfully");

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