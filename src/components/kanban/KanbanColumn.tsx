import { useDroppable } from "@dnd-kit/core";
import { KanbanTask } from "./KanbanTask";
import { Tables } from "@/integrations/supabase/types";

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
}

export function KanbanColumn({ 
  id, 
  title, 
  tasks,
  isSelectionMode = false,
  selectedTasks = [],
  onTaskSelect
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className="bg-[#242832] rounded-lg p-4 min-h-[200px]"
    >
      <h3 className="font-medium mb-4">{title}</h3>
      <div className="space-y-3">
        {tasks.map((task) => (
          <KanbanTask 
            key={task.id} 
            task={task} 
            isSelectionMode={isSelectionMode}
            isSelected={selectedTasks.includes(task.id)}
            onSelect={onTaskSelect}
          />
        ))}
      </div>
    </div>
  );
}