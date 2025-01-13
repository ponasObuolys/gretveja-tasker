import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

interface TaskDragHandleProps {
  disabled?: boolean;
  attributes?: DraggableAttributes;
  listeners?: SyntheticListenerMap;
  setNodeRef?: (element: HTMLElement | null) => void;
}

export function TaskDragHandle({ 
  disabled,
  attributes,
  listeners,
  setNodeRef
}: TaskDragHandleProps) {
  return (
    <div
      ref={setNodeRef}
      {...(disabled ? {} : { ...attributes, ...listeners })}
      className="absolute inset-0 z-9"
      onClick={(e) => e.stopPropagation()}
    />
  );
}