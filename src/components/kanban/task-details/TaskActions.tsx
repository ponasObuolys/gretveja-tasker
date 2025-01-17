import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface TaskActionsProps {
  isAdmin: boolean;
  onDelete: () => void;
}

export function TaskActions({ isAdmin, onDelete }: TaskActionsProps) {
  if (!isAdmin) return null;

  return (
    <Button
      variant="destructive"
      size="icon"
      onClick={onDelete}
      className="delete-button"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}