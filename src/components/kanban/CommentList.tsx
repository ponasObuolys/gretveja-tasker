import { format } from "date-fns";
import { lt } from "date-fns/locale";
import { PaperclipIcon, LinkIcon } from "lucide-react";
import type { TaskComment } from "./types";

interface CommentListProps {
  comments: TaskComment[];
}

export function CommentList({ comments }: CommentListProps) {
  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="bg-secondary/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-start">
            <div className="font-medium">{comment.user?.email || "Nežinomas vartotojas"}</div>
            <div className="text-sm text-muted-foreground">
              {format(new Date(comment.created_at), "PPP", { locale: lt })}
            </div>
          </div>
          <p className="text-sm">{comment.comment}</p>
          {comment.attachments && (comment.attachments as any[]).length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {(comment.attachments as any[]).map((file, index) => (
                <a
                  key={index}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-blue-500 hover:underline"
                >
                  <PaperclipIcon className="w-4 h-4" />
                  {file.filename}
                </a>
              ))}
            </div>
          )}
          {comment.links && comment.links.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {comment.links.map((link, index) => (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-blue-500 hover:underline"
                >
                  <LinkIcon className="w-4 h-4" />
                  {link}
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}