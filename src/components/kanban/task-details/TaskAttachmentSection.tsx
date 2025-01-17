import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FileInput } from "./FileInput";
import { handleFileUpload } from "@/utils/fileUpload";

interface TaskAttachmentSectionProps {
  taskId: string;
  isAdmin: boolean;
}

export function TaskAttachmentSection({ taskId, isAdmin }: TaskAttachmentSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [newLink, setNewLink] = useState("");
  const queryClient = useQueryClient();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = Array.from(event.target.files || []);
    if (!isAdmin || files.length === 0) return;

    setIsUploading(true);
    try {
      await handleFileUpload(files, taskId, queryClient);
    } finally {
      setIsUploading(false);
      // Reset the file input
      event.target.value = '';
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

      setNewLink("");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (error) {
      console.error("Error adding link:", error);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <FileInput isUploading={isUploading} onFileChange={handleFileChange} />
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