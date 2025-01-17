import { format } from "date-fns";
import { Tables } from "@/integrations/supabase/types";

interface TaskHeaderProps {
  task: Tables<"tasks"> & {
    created_by_profile?: {
      email: string | null;
    } | null;
  };
}

export function TaskHeader({ task }: TaskHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm text-muted-foreground">
          Created by: {task.created_by_profile?.email ?? "Unknown"}
        </div>
        {task.deadline && (
          <div className="text-sm text-muted-foreground">
            Deadline: {format(new Date(task.deadline), "yyyy-MM-dd")}
          </div>
        )}
      </div>

      <p className="text-gray-400 whitespace-pre-wrap">
        {task.description}
      </p>
    </div>
  );
}