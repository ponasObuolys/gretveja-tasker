import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, PaperclipIcon, LinkIcon } from "lucide-react";

interface TaskAttachmentSectionProps {
  taskId: string;
  isAdmin: boolean;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
}

export function TaskAttachmentSection({ 
  taskId, 
  isAdmin,
  onUploadStart,
  onUploadEnd 
}: TaskAttachmentSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [newLink, setNewLink] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const files = Array.from(event.target.files || []);
    if (!isAdmin || files.length === 0) return;

    setIsUploading(true);
    onUploadStart?.();

    try {
      for (const file of files) {
        const fileName = file.name;
        const filePath = `${taskId}/${Date.now()}_${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("task_attachments")
          .upload(filePath, file, {
            upsert: true,
            cacheControl: "3600"
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("task_attachments")
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from("task_attachments")
          .insert({
            task_id: taskId,
            file_name: fileName,
            file_url: publicUrl,
          });

        if (dbError) throw dbError;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["task-attachments"] }),
        queryClient.invalidateQueries({ queryKey: ["tasks"] })
      ]);
      
      toast({
        title: "Failai įkelti",
        description: "Failai sėkmingai įkelti prie užduoties",
      });

    } catch (error) {
      console.error("Error uploading files:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko įkelti failų",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      onUploadEnd?.();
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAdmin || !newLink) return;

    try {
      const { error } = await supabase
        .from("task_links")
        .insert({
          task_id: taskId,
          url: newLink,
        });

      if (error) throw error;

      toast({
        title: "Nuoroda pridėta",
        description: "Nuoroda sėkmingai pridėta prie užduoties",
      });

      setNewLink("");
      await queryClient.invalidateQueries({ queryKey: ["task-links"] });
    } catch (error) {
      console.error("Error adding link:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko pridėti nuorodos",
        variant: "destructive",
      });
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-4" onClick={e => e.stopPropagation()}>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="relative flex-1"
          disabled={isUploading}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            onClick={(e) => e.stopPropagation()}
          />
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <PaperclipIcon className="h-4 w-4 mr-2" />
          )}
          {isUploading ? "Įkeliama..." : "Prisegti failus"}
        </Button>
        <form 
          onSubmit={handleAddLink} 
          className="flex gap-2 flex-1"
          onClick={e => e.stopPropagation()}
        >
          <Input
            type="url"
            placeholder="Įvesti nuorodą..."
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            onClick={e => e.stopPropagation()}
          />
          <Button
            type="submit"
            variant="outline"
            disabled={!newLink}
            onClick={(e) => e.stopPropagation()}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}