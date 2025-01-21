import { cn } from "@/lib/utils";
import { DraggableProvided } from "@hello-pangea/dnd";
import { Tables } from "@/integrations/supabase/types";

interface DraggableTaskContainerProps {
  task: Tables<"tasks">;
  provided: DraggableProvided;
  isDragging: boolean;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}

export function DraggableTaskContainer({
  task,
  provided,
  isDragging,
  onClick,
  children,
}: DraggableTaskContainerProps) {
  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={cn(
        "relative bg-[#1A1D24] rounded-lg p-4 transition-all duration-200 ease-in-out",
        "cursor-pointer hover:bg-[#242832] hover:border-[#FF4B6D] hover:border-2 border-solid",
        "z-10 pointer-events-auto",
        isDragging && "ring-2 ring-primary shadow-lg shadow-primary/20",
        task.is_commenting && "ring-2 ring-primary"
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}