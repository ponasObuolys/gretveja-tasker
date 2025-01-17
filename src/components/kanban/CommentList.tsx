import { format } from "date-fns";
import { lt } from "date-fns/locale";
import { PaperclipIcon, LinkIcon, Download } from "lucide-react";
import type { TaskComment } from "./types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CommentListProps {
  comments: TaskComment[];
}

export function CommentList({ comments }: CommentListProps) {
  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

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
          <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
          
          {(comment.attachments?.length > 0 || comment.links?.length > 0) && (
            <ScrollArea className="h-[100px] rounded-md border p-2 mt-2">
              <div className="space-y-2">
                {comment.attachments && comment.attachments.map((file: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-secondary/50 p-2 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <PaperclipIcon className="w-4 h-4" />
                      <span className="text-sm">{file.filename}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(file.url, file.filename)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {comment.links && comment.links.map((link: string, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-secondary/50 p-2 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" />
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:underline"
                      >
                        {link}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      ))}
    </div>
  );
}