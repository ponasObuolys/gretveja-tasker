import { isPast } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Tables } from "@/integrations/supabase/types";
import { TaskPriorityBadge } from "./task-content/TaskPriorityBadge";
import { TaskAttachmentsBadge } from "./task-content/TaskAttachmentsBadge";
import { TaskMetadata } from "./task-content/TaskMetadata";
import { useTaskAttachments } from "./task-content/useTaskAttachments";

interface TaskContentProps {
  task: Tables<"tasks"> & {
    created_by_profile?: {
      email: string | null;
    } | null;
    moved_by_profile?: {
      email: string | null;
    } | null;
  };
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (taskId: string) => void;
}

const TERMINAL_STATUSES = ["IVYKDYTOS", "ATMESTA"];

export function TaskContent({
  task,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
}: TaskContentProps) {
  const isTerminalStatus = TERMINAL_STATUSES.includes(task.status);
  const isOverdue = !isTerminalStatus && task.deadline ? isPast(new Date(task.deadline)) : false;

  const { data: attachments, isError } = useTaskAttachments(task.id);

  return (
    <div className="flex items-start gap-2">
      {isSelectionMode && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect?.(task.id)}
          className="mt-1"
        />
      )}

      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className={cn(
            "font-medium leading-tight text-sm lg:text-base break-words line-clamp-2",
            isTerminalStatus && "line-through opacity-50"
          )}>
            {task.title}
          </h3>

          <div className="flex items-center gap-1 flex-shrink-0">
            {isOverdue && (
              <Badge variant="destructive" className="text-[10px] whitespace-nowrap">
                Vėluoja
              </Badge>
            )}
            <TaskPriorityBadge priority={task.priority} />
            {!isError && <TaskAttachmentsBadge count={attachments.length} />}
          </div>
        </div>

        <TaskMetadata
          creatorEmail={task.created_by_profile?.email}
          moverEmail={task.moved_by_profile?.email}
          deadline={task.deadline}
        />

        {task.description && (
          <p className="text-sm text-gray-400 line-clamp-2 break-words px-1">
            {task.description}
          </p>
        )}
      </div>
    </div>
  );
}