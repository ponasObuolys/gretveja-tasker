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
}

export function TaskAttachmentSection({ taskId, isAdmin }: TaskAttachmentSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [newLink, setNewLink] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const files = Array.from(event.target.files || []);
    if (!isAdmin || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of files) {
        const fileExt = file.name.split(".").pop();
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
        description: "Failai sėkmingai įkelti prie užduoties",
      });

      queryClient.invalidateQueries({ queryKey: ["task-attachments", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", taskId] });
      queryClient.invalidateQueries({ queryKey: ["task-links", taskId] });
    } catch (error) {
      console.error("Error uploading files:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko įkelti failų",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
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
      queryClient.invalidateQueries({ queryKey: ["task-links", taskId] });
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
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="relative flex-1"
          disabled={isUploading}
          onClick={(e) => e.preventDefault()}
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
        <form onSubmit={handleAddLink} className="flex gap-2 flex-1">
          <Input
            type="url"
            placeholder="Įvesti nuorodą..."
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
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