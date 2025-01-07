import { Card } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import { useDroppable } from "@dnd-kit/core";
import { KanbanTask } from "./KanbanTask";

interface KanbanColumnProps {
  id: Tables<"tasks">["status"];
  title: string;
  tasks: Tables<"tasks">[];
}

export function KanbanColumn({ id, title, tasks }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <Card className="flex-shrink-0 w-80 bg-muted/50">
      <div className="p-4 font-medium border-b bg-muted">
        {title} ({tasks.length})
      </div>
      <div
        ref={setNodeRef}
        className="p-4 space-y-4 min-h-[200px]"
      >
        {tasks.map((task) => (
          <KanbanTask key={task.id} task={task} />
        ))}
      </div>
    </Card>
  );
}