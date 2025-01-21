import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Download, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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

export function TaskAttachments({
  isAdmin,
  taskId,
  onDeleteFile,
  attachments = [],
}: TaskAttachmentsProps) {
  const { toast } = useToast();
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());

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

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      setDownloadingFiles(prev => new Set(prev).add(fileName));

      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Nepavyko atsisiųsti failo');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Failas atsisiųstas",
        description: "Failas sėkmingai atsisiųstas",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Klaida",
        description: "Nepavyko atsisiųsti failo",
        variant: "destructive",
      });
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileName);
        return newSet;
      });
    }
  };

  if (displayAttachments.length === 0) {
    return (
      <div className="text-sm text-gray-400 text-center py-4">
        Nėra prisegtų dokumentų
      </div>
    );
  }

  return (
    <ScrollArea className="h-auto max-h-[200px] w-full rounded-md border border-border bg-card/50 p-4">
      <div className="space-y-2">
        {displayAttachments.map((attachment) => (
          <div
            key={attachment.id}
            className="file-item group flex items-center justify-between gap-2"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-sm flex-1 min-w-0">
              <FileText className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="truncate">{attachment.file_name}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleDownload(attachment.file_url, attachment.file_name)}
                disabled={downloadingFiles.has(attachment.file_name)}
              >
                <Download className={`h-4 w-4 ${downloadingFiles.has(attachment.file_name) ? 'animate-pulse' : ''}`} />
              </Button>

              {isAdmin && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="delete-file opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDeleteFile(attachment.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}