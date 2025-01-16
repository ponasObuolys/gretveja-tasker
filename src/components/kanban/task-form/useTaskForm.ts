import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { taskSchema, TaskFormValues } from "./types";

export function useTaskForm(onSuccess: () => void) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: 1,
      deadline: "",
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const uploadFiles = async (taskId: string, userId: string) => {
    for (const file of selectedFiles) {
      const fileExt = file.name.split(".").pop();
      const filePath = `${taskId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("task_attachments")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Error uploading file:", uploadError);
        continue;
      }

      const { error: dbError } = await supabase.from("attachments").insert({
        task_id: taskId,
        file_path: filePath,
        file_name: file.name,
        content_type: file.type,
        created_by: userId,
      });

      if (dbError) {
        console.error("Error saving attachment metadata:", dbError);
      }
    }
  };

  const onSubmit = async (data: TaskFormValues) => {
    try {
      setIsSubmitting(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("No authenticated user found");
      }

      console.log("Creating task with data:", data);

      const { data: task, error } = await supabase
        .from("tasks")
        .insert({
          title: data.title,
          description: data.description,
          priority: data.priority,
          deadline: data.deadline || null,
          created_by: user.id,
        })
        .select(`
          *,
          created_by_profile:profiles!tasks_created_by_fkey(
            email
          )
        `)
        .single();

      if (error) throw error;

      console.log("Task created successfully:", task);

      if (selectedFiles.length > 0 && task) {
        await uploadFiles(task.id, user.id);
      }

      // Get all profiles except the creator to notify them
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .neq('id', user.id);

      if (profiles) {
        const notifications = profiles.map(profile => ({
          user_id: profile.id,
          task_id: task.id,
          action: "sukūrė užduotį",
        }));

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notificationError) {
          console.error("Error creating notifications:", notificationError);
        }
      }

      // Invalidate queries to trigger UI updates
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      
      toast({
        title: "Užduotis sukurta",
        description: "Užduotis sėkmingai sukurta",
      });
      
      form.reset();
      setSelectedFiles([]);
      onSuccess();
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko sukurti užduoties",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isSubmitting,
    selectedFiles,
    handleFileChange,
    onSubmit: form.handleSubmit(onSubmit),
  };
}