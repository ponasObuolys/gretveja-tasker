import { format, isPast } from "date-fns";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Tables } from "@/integrations/supabase/types";

interface TaskContentProps {
  task: Tables<"tasks"> & {
    created_by_profile?: {
      email: string | null;
    } | null;
  };
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (taskId: string) => void;
}

const TERMINAL_STATUSES = ["IVYKDYTOS", "ATMESTOS"];

export function TaskContent({ 
  task,
  isSelectionMode,
  isSelected,
  onSelect
}: TaskContentProps) {
  const isTerminalStatus = TERMINAL_STATUSES.includes(task.status);
  const isOverdue = !isTerminalStatus && task.deadline ? isPast(new Date(task.deadline)) : false;

  return (
    <div className="flex items-start gap-2">
      {isSelectionMode && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect?.(task.id)}
          className="mt-1"
          onClick={(e) => e.stopPropagation()}
        />
      )}
      <div className="flex-1 space-y-3">
        <div className="space-y-2">
          <h4 className="text-base font-bold leading-tight">{task.title}</h4>
          {task.description && (
            <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {task.deadline && (
            <Badge 
              variant="secondary" 
              className={cn(
                "text-xs",
                isOverdue && "bg-[#ff4b6e] text-white"
              )}
            >
              {format(new Date(task.deadline), "MM-dd")}
            </Badge>
          )}
          {task.priority >= 3 && (
            <Star className="h-4 w-4 text-[#FFD700]" fill="#FFD700" />
          )}
        </div>

        <div className="text-xs text-gray-400">
          {task.created_by_profile?.email ?? "Unknown"}
        </div>
      </div>
    </div>
  );
}