import { Button } from "@/components/ui/button";
import { CreateTaskDialog } from "../kanban/CreateTaskDialog";
import { useToast } from "@/hooks/use-toast";
import { deleteSelectedTasks } from "@/utils/taskDeletion";

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

    const result = await deleteSelectedTasks(selectedTasks, toast);
    
    toast({
      title: result.success ? "Užduotys ištrintos" : "Klaida",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });

    if (result.success) {
      setSelectedTasks([]);
      setIsSelectionMode(false);
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