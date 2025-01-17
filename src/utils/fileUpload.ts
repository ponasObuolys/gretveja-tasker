import { supabase } from "@/integrations/supabase/client";
import { QueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export const uploadTaskFile = async (
  file: File,
  taskId: string,
  queryClient: QueryClient
) => {
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

  return publicUrl;
};

export const handleFileUpload = async (
  files: File[],
  taskId: string,
  queryClient: QueryClient
) => {
  try {
    for (const file of files) {
      await uploadTaskFile(file, taskId, queryClient);
    }

    toast({
      title: "Failai įkelti",
      description: "Failai sėkmingai įkelti prie užduoties",
    });

    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["task-attachments"] });
  } catch (error) {
    console.error("Error uploading files:", error);
    toast({
      title: "Klaida",
      description: "Nepavyko įkelti failų",
      variant: "destructive",
    });
    throw error;
  }
};