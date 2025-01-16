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
      
      // First, delete associated notifications using a single query
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

      console.log("Successfully deleted notifications, proceeding to delete tasks");

      // Then delete the tasks in a separate query
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

      // Only show success message and reset state if both operations succeeded
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