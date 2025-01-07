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
    <Card className="flex-1 bg-muted/50 min-w-[280px] md:min-w-0">
      <div className="p-4 font-medium border-b bg-muted flex justify-between items-center">
        <span>{title}</span>
        <span className="text-sm text-muted-foreground">({tasks.length})</span>
      </div>
      <div
        ref={setNodeRef}
        className="p-4 space-y-4 min-h-[200px] max-h-[calc(100vh-20rem)] overflow-y-auto"
      >
        {tasks.map((task) => (
          <KanbanTask key={task.id} task={task} />
        ))}
      </div>
    </Card>
  );
}