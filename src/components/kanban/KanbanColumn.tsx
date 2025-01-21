import { KanbanTask } from "./KanbanTask";
import { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { DroppableProvided, DroppableStateSnapshot } from "@hello-pangea/dnd";

interface KanbanColumnProps {
  id: Tables<"tasks">["status"];
  title: string;
  tasks: Array<Tables<"tasks"> & {
    profiles?: {
      email: string | null;
    } | null;
  }>;
  isSelectionMode?: boolean;
  selectedTasks?: string[];
  onTaskSelect?: (taskId: string) => void;
  provided: DroppableProvided;
  isDraggingOver: boolean;
}

export function KanbanColumn({ 
  id, 
  title, 
  tasks,
  isSelectionMode = false,
  selectedTasks = [],
  onTaskSelect,
  provided,
  isDraggingOver
}: KanbanColumnProps) {
  return (
    <div
      ref={provided.innerRef}
      {...provided.droppableProps}
      className={cn(
        "bg-[#242832] rounded-lg p-4 h-full w-full transition-colors",
        "flex flex-col min-h-[24rem]",
        isDraggingOver && "bg-[#2A2F3A]",
        "relative"
      )}
    >
      <h3 className="font-medium mb-4 truncate text-sm lg:text-base">{title}</h3>
      <div className="space-y-3 flex-1 overflow-y-auto">
        {tasks.map((task, index) => (
          <KanbanTask 
            key={task.id} 
            task={task}
            index={index}
            isSelectionMode={isSelectionMode}
            isSelected={selectedTasks.includes(task.id)}
            onSelect={onTaskSelect}
          />
        ))}
        {provided.placeholder}
      </div>
      {isDraggingOver && (
        <div className="absolute inset-x-0 bottom-0 h-0.5">
          <div className="h-full bg-primary animate-pulse rounded-full" />
        </div>
      )}
    </div>
  );
}