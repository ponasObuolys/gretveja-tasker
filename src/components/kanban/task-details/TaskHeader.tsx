import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Tables } from "@/integrations/supabase/types";

interface TaskHeaderProps {
  task: Tables<"tasks"> & {
    created_by_profile?: {
      email: string | null;
    } | null;
  };
}

export function TaskHeader({ task }: TaskHeaderProps) {
  const isOverdue = task?.deadline ? new Date(task.deadline) < new Date() : false;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">
          {task.created_by_profile?.email ?? "Nežinomas"}
        </Badge>
        {task.deadline && (
          <Badge 
            variant="secondary"
            className={cn(
              isOverdue && "bg-[#ff4b6e] text-white"
            )}
          >
            {format(new Date(task.deadline), "yyyy-MM-dd")}
          </Badge>
        )}
        {task.priority >= 3 && (
          <Star className="h-4 w-4 text-[#FFD700]" fill="#FFD700" />
        )}
      </div>

      <p className="text-gray-400 whitespace-pre-wrap">
        {task.description}
      </p>
    </div>
  );
}