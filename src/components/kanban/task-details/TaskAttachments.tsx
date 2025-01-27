import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Download, X, Upload } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface TaskAttachmentsProps {
  isAdmin: boolean;
  taskId: string;
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
  const queryClient = useQueryClient();
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setIsUploading(true);
    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${taskId}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("task_attachments")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("task_attachments")
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from("task_attachments")
          .insert({
            task_id: taskId,
            file_name: file.name,
            file_url: publicUrl,
          });

        if (dbError) throw dbError;
      }

      toast({
        title: "Failai įkelti",
        description: "Failai sėkmingai įkelti",
      });

      queryClient.invalidateQueries({ queryKey: ["task-attachments"] });
    } catch (error) {
      console.error("Error uploading files:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko įkelti failų",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      setDownloadingFiles(prev => new Set(prev).add(fileName));

      const response = await fetch(fileUrl);
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

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Prisegti failai:</h4>
      
      {isAdmin && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="w-full relative"
            disabled={isUploading}
          >
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? "Įkeliama..." : "Įkelti failus"}
          </Button>
        </div>
      )}

      <ScrollArea className="h-[200px] w-full rounded-md border p-4">
        <div className="space-y-2">
          {displayAttachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between gap-2 group"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileText className="h-4 w-4 flex-shrink-0" />
                <span className="truncate text-sm">{attachment.file_name}</span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDownload(attachment.file_url, attachment.file_name)}
                  disabled={downloadingFiles.has(attachment.file_name)}
                >
                  <Download className="h-4 w-4" />
                </Button>

                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                    onClick={() => onDeleteFile(attachment.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {displayAttachments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Nėra prisegtų failų
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}