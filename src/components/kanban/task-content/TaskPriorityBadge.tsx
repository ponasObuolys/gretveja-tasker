import { Star } from "lucide-react";

interface TaskPriorityBadgeProps {
  priority: number;
}

export function TaskPriorityBadge({ priority }: TaskPriorityBadgeProps) {
  if (priority < 3) return null;

  return (
    <Star className="h-4 w-4 text-[#FFD700] flex-shrink-0" fill="#FFD700" />
  );
}