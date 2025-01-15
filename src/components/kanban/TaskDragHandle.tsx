interface TaskDragHandleProps {
  disabled?: boolean;
}

export function TaskDragHandle({ disabled }: TaskDragHandleProps) {
  return (
    <div
      className="absolute inset-0 z-9"
      onClick={(e) => e.stopPropagation()}
    />
  );
}