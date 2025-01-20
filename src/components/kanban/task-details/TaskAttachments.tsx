import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, FileSpreadsheet, X, FileIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TaskAttachmentsProps {
  isAdmin: boolean;
  taskId?: string;
  onDeleteFile: (attachmentId: string) => void;
  attachments?: {
    id: string;
    file_name: string;
    file_url: string;
  }[];
}

const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return <FileText className="h-5 w-5 text-primary" />;
    case 'xls':
    case 'xlsx':
      return <FileSpreadsheet className="h-5 w-5 text-primary" />;
    default:
      return <FileIcon className="h-5 w-5 text-primary" />;
  }
};

export function TaskAttachments({
  isAdmin,
  taskId,
  onDeleteFile,
  attachments = [],
}: TaskAttachmentsProps) {
  const { data: fetchedAttachments = [] } = useQuery({
    queryKey: ["task-attachments", taskId],
    queryFn: async () => {
      if (!taskId) return [];
      
      const { data, error } = await supabase
        .from("task_attachments")
        .select("*")
        .eq("task_id", taskId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!taskId && attachments.length === 0,
  });

  const displayAttachments = attachments.length > 0 ? attachments : fetchedAttachments;

  if (displayAttachments.length === 0) return null;

  return (
    <div className="space-y-2 mt-4" onClick={e => e.stopPropagation()}>
      <h3 className="text-sm font-medium">Prisegti dokumentai:</h3>
      <ScrollArea className="h-auto max-h-[200px] w-full rounded-md border border-border bg-card/50 p-4">
        <div className="space-y-2">
          {displayAttachments.map((attachment) => (
            <div
              key={attachment.id}
              className="file-item group flex items-center justify-between gap-2 bg-secondary/50 p-3 rounded-lg"
              onClick={e => e.stopPropagation()}
            >
              <a
                href={attachment.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm hover:text-primary flex-1"
                onClick={e => e.stopPropagation()}
              >
                {getFileIcon(attachment.file_name)}
                <span className="truncate">{attachment.file_name}</span>
              </a>
              {isAdmin && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="delete-file opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDeleteFile(attachment.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}