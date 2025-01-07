import { Card } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { lt } from "date-fns/locale";

interface KanbanTaskProps {
  task: Tables<"tasks">;
  isDragging?: boolean;
}

export function KanbanTask({ task, isDragging }: KanbanTaskProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-4 cursor-grab active:cursor-grabbing hover:bg-accent transition-colors",
        isDragging && "opacity-50"
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex gap-2 mb-2">
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-[#E6F3FF] text-[#000000]">
          Užduotis
        </span>
        {task.priority > 2 && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-[#FF0000] text-[#FFFFFF]">
            SVARBI UŽDUOTIS
          </span>
        )}
      </div>
      <div className="font-medium">{task.title}</div>
      {task.description && (
        <div className="mt-2 text-sm text-muted-foreground">
          {task.description}
        </div>
      )}
      {task.deadline && (
        <div className="mt-2 text-sm text-muted-foreground">
          Terminas: {format(new Date(task.deadline), "PPP", { locale: lt })}
        </div>
      )}
      <div className="mt-2 text-sm">
        Prioritetas: {task.priority}
      </div>
    </Card>
  );
}