import { Button } from "@/components/ui/button";
import { CreateTaskDialog } from "../kanban/CreateTaskDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TaskActionsProps {
  isAdmin: boolean;
  isSelectionMode: boolean;
  selectedTasks: string[];
  setIsSelectionMode: (value: boolean) => void;
  setSelectedTasks: (value: string[]) => void;
}

export function TaskActions({
  isAdmin,
  isSelectionMode,
  selectedTasks,
  setIsSelectionMode,
  setSelectedTasks,
}: TaskActionsProps) {
  const { toast } = useToast();

  const handleDeleteSelected = async () => {
    if (!isAdmin || selectedTasks.length === 0) return;

    try {
      console.log("Starting deletion process for tasks:", selectedTasks);
      
      // First delete task links
      const { error: linksError } = await supabase
        .from("task_links")
        .delete()
        .in("task_id", selectedTasks);

      if (linksError) {
        console.error("Error deleting task links:", linksError);
        toast({
          title: "Klaida",
          description: "Nepavyko ištrinti nuorodų",
          variant: "destructive",
        });
        return;
      }

      console.log("Successfully deleted task links");

      // Then delete task comments
      const { error: commentsError } = await supabase
        .from("task_comments")
        .delete()
        .in("task_id", selectedTasks);

      if (commentsError) {
        console.error("Error deleting task comments:", commentsError);
        toast({
          title: "Klaida",
          description: "Nepavyko ištrinti komentarų",
          variant: "destructive",
        });
        return;
      }

      console.log("Successfully deleted task comments");

      // Then delete task attachments
      const { error: attachmentsError } = await supabase
        .from("task_attachments")
        .delete()
        .in("task_id", selectedTasks);

      if (attachmentsError) {
        console.error("Error deleting task attachments:", attachmentsError);
        toast({
          title: "Klaida",
          description: "Nepavyko ištrinti priedų",
          variant: "destructive",
        });
        return;
      }

      console.log("Successfully deleted task attachments");

      // Then delete notifications
      const { error: notificationsError } = await supabase
        .from("notifications")
        .delete()
        .in("task_id", selectedTasks);

      if (notificationsError) {
        console.error("Error deleting notifications:", notificationsError);
        toast({
          title: "Klaida",
          description: "Nepavyko ištrinti pranešimų",
          variant: "destructive",
        });
        return;
      }

      console.log("Successfully deleted notifications");

      // Finally delete the tasks
      const { error: tasksError } = await supabase
        .from("tasks")
        .delete()
        .in("id", selectedTasks);

      if (tasksError) {
        console.error("Error deleting tasks:", tasksError);
        toast({
          title: "Klaida",
          description: "Nepavyko ištrinti užduočių",
          variant: "destructive",
        });
        return;
      }

      console.log("Successfully completed task deletion");

      toast({
        title: "Užduotys ištrintos",
        description: `Sėkmingai ištrinta ${selectedTasks.length} užduočių`,
      });

      setSelectedTasks([]);
      setIsSelectionMode(false);
    } catch (error) {
      console.error("Unexpected error during deletion:", error);
      toast({
        title: "Klaida",
        description: "Įvyko nenumatyta klaida trinant užduotis",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <CreateTaskDialog />
      {isAdmin && (
        <>
          <Button
            variant={isSelectionMode ? "secondary" : "outline"}
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) {
                setSelectedTasks([]);
              }
            }}
          >
            {isSelectionMode ? "Atšaukti žymėjimą" : "Pažymėti"}
          </Button>
          {isSelectionMode && (
            <Button
              variant="destructive"
              onClick={handleDeleteSelected}
              disabled={selectedTasks.length === 0}
            >
              Ištrinti ({selectedTasks.length})
            </Button>
          )}
        </>
      )}
    </div>
  );
}