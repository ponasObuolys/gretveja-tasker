import { format, isPast } from "date-fns";
import { Star, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Tables } from "@/integrations/supabase/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

const TERMINAL_STATUSES = ["IVYKDYTOS", "ATMESTOS"];

export function TaskContent({
  task,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
}: TaskContentProps) {
  const { toast } = useToast();
  const isTerminalStatus = TERMINAL_STATUSES.includes(task.status);
  const isOverdue = !isTerminalStatus && task.deadline ? isPast(new Date(task.deadline)) : false;

  const { data: attachments, isError } = useQuery({
    queryKey: ["task-attachments", task.id],
    queryFn: async () => {
      console.log("Fetching attachments for task:", task.id);
      const { data, error } = await supabase
        .from("task_attachments")
        .select("*")
        .eq("task_id", task.id);
      
      if (error) {
        console.error("Error fetching attachments:", error);
        toast({
          title: "Klaida",
          description: "Nepavyko gauti prisegtų failų",
          variant: "destructive",
        });
        throw error;
      }
      
      console.log("Fetched attachments:", data);
      return data;
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

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
            {task.priority >= 3 && (
              <Star className="h-4 w-4 text-[#FFD700] flex-shrink-0" fill="#FFD700" />
            )}
            {!isError && attachments && attachments.length > 0 && (
              <Badge variant="outline" className="text-xs flex items-center gap-1 whitespace-nowrap">
                <Paperclip className="h-3 w-3" />
                {attachments.length}
              </Badge>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-400 truncate">
          {task.created_by_profile?.email && (
            <span>Sukūrė: {task.created_by_profile.email}</span>
          )}
          {task.moved_by_profile?.email && (
            <>
              <span className="mx-1">•</span>
              <span>Perkėlė: {task.moved_by_profile.email}</span>
            </>
          )}
          {task.deadline && (
            <>
              <span className="mx-1">•</span>
              <span>Terminas: {format(new Date(task.deadline), "yyyy-MM-dd")}</span>
            </>
          )}
        </div>

        {task.description && (
          <p className="text-sm text-gray-400 line-clamp-2 break-words px-1">
            {task.description}
          </p>
        )}
      </div>
    </div>
  );
}