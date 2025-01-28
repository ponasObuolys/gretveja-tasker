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
        "min-h-[180px] w-full cursor-pointer",
        "hover:bg-[#242832] hover:shadow-md",
        "border-l-4",
        {
          "border-green-500": task.status === "IVYKDYTOS",
          "border-red-500": task.status === "ATMESTOS",
          "border-yellow-500": task.status === "VELUOJANCIOS",
          "border-blue-500": task.status === "VYKDOMOS",
          "border-gray-500": task.status === "NUKELTOS",
          "border-primary": task.status === "NAUJOS",
        },
        isDragging && "ring-2 ring-primary shadow-lg shadow-primary/20",
        task.is_commenting && "ring-2 ring-primary",
        task.status === "IVYKDYTOS" && "opacity-75"
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}