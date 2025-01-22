import { Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TaskAttachmentsBadgeProps {
  count: number;
}

export function TaskAttachmentsBadge({ count }: TaskAttachmentsBadgeProps) {
  if (count === 0) return null;
  
  return (
    <Badge variant="outline" className="text-xs flex items-center gap-1 whitespace-nowrap">
      <Paperclip className="h-3 w-3" />
      {count}
    </Badge>
  );
}