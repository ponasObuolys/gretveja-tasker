import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Link as LinkIcon, X, FileSpreadsheet } from "lucide-react";
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

const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return <FileText className="h-4 w-4" />;
    case 'xls':
    case 'xlsx':
      return <FileSpreadsheet className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

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
    <ScrollArea className="h-[200px] w-full rounded-md border p-4">
      <div className="space-y-4">
        {attachments.length > 0 && (
          <div className="attached-files">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="file-item group flex items-center justify-between p-2 hover:bg-gray-100 rounded">
                <a
                  href={attachment.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:text-primary"
                >
                  {getFileIcon(attachment.file_name)}
                  <span className="truncate">{attachment.file_name}</span>
                </a>
                {isAdmin && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
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
        )}

        {links.length > 0 && (
          <div className="attached-files">
            {links.map((link) => (
              <div key={link.id} className="file-item group flex items-center justify-between p-2 hover:bg-gray-100 rounded">
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
    </ScrollArea>
  );
}