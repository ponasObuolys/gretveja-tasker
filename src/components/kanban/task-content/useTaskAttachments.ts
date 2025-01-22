import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function useTaskAttachments(taskId: string) {
  return useQuery({
    queryKey: ["task-attachments", taskId],
    queryFn: async () => {
      console.log("Fetching attachments for task:", taskId);
      try {
        const { data, error } = await supabase
          .from("task_attachments")
          .select("*")
          .eq("task_id", taskId);
        
        if (error) {
          console.error("Error fetching attachments:", error);
          throw error;
        }
        
        console.log("Fetched attachments:", data);
        return data || [];
      } catch (error) {
        console.error("Failed to fetch attachments:", error);
        return [];
      }
    },
    retry: false,
    enabled: !!taskId,
    initialData: [],
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (previously cacheTime)
  });
}