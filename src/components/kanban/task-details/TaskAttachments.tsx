import { Button } from "@/components/ui/button";
import { FileText, Link as LinkIcon, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TaskAttachmentsProps {
  isAdmin: boolean;
  attachments?: {
    id: string;
    file_name: string;
    file_url: string;
  }[];
  onDeleteFile: (attachmentId: string) => void;
  taskId?: string;
}

export function TaskAttachments({
  isAdmin,
  attachments = [],
  onDeleteFile,
  taskId,
}: TaskAttachmentsProps) {
  const { data: links = [] } = useQuery({
    queryKey: ["task-links", taskId],
    queryFn: async () => {
      if (!taskId) return [];
      
      const { data, error } = await supabase
        .from("task_links")
        .select("*")
        .eq("task_id", taskId);
        
      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });

  if (attachments.length === 0 && links.length === 0) return null;

  return (
    <div className="space-y-4">
      {attachments.length > 0 && (
        <div className="attached-files">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="file-item">
              <a
                href={attachment.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:text-primary"
              >
                <FileText className="h-4 w-4" />
                <span className="truncate">{attachment.file_name}</span>
              </a>
              {isAdmin && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="delete-file"
                  onClick={() => onDeleteFile(attachment.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {links.length > 0 && (
        <div className="attached-files">
          {links.map((link) => (
            <div key={link.id} className="file-item">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:text-primary"
              >
                <LinkIcon className="h-4 w-4" />
                <span className="truncate">{link.url}</span>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}