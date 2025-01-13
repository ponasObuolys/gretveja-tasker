import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CommentFileUploadProps {
  taskId: string;
  onUploadComplete: (files: Array<{ filename: string; url: string; type: string }>) => void;
}

export async function uploadFiles(taskId: string, files: File[]) {
  const uploadedFiles = [];
  
  for (const file of files) {
    const fileExt = file.name.split(".").pop();
    const filePath = `${taskId}/${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("comment_attachments")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      continue;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("comment_attachments")
      .getPublicUrl(filePath);

    uploadedFiles.push({
      filename: file.name,
      url: publicUrl,
      type: file.type,
    });
  }

  return uploadedFiles;
}

export function CommentFileUpload({ taskId, onUploadComplete }: CommentFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const validFiles = selectedFiles.filter(file => {
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ];
      const validSize = file.size <= 10 * 1024 * 1024; // 10MB
      return validTypes.includes(file.type) && validSize;
    });

    if (validFiles.length !== selectedFiles.length) {
      toast({
        title: "Netinkami failai",
        description: "Kai kurie failai buvo atmesti. Leidžiami tik .pdf, .doc, .docx, .xls, .xlsx failai iki 10MB.",
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      setIsUploading(true);
      try {
        const uploadedFiles = await uploadFiles(taskId, validFiles);
        onUploadComplete(uploadedFiles);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <Input
      type="file"
      onChange={handleFileChange}
      accept=".pdf,.doc,.docx,.xls,.xlsx"
      multiple
      className="max-w-[300px]"
      disabled={isUploading}
    />
  );
}