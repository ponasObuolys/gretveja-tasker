import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";
import { ActivityType } from "./types";

export function useActivities() {
  return useQuery({
    queryKey: ["activities"],
    queryFn: async () => {
      console.log("Fetching activities for the last 7 days");
      const sevenDaysAgo = subDays(new Date(), 7);
      
      // Fetch tasks with recent activity
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          *,
          created_by_profile:profiles!tasks_created_by_fkey(email),
          moved_by_profile:profiles!tasks_moved_by_fkey(email)
        `)
        .gte('updated_at', sevenDaysAgo.toISOString())
        .order('updated_at', { ascending: false });

      if (tasksError) throw tasksError;

      // Fetch recent comments
      const { data: comments, error: commentsError } = await supabase
        .from("task_comments")
        .select(`
          *,
          tasks!inner(title)
        `)
        .gte('created_at', sevenDaysAgo.toISOString());

      if (commentsError) throw commentsError;

      // Fetch recent file uploads
      const { data: attachments, error: attachmentsError } = await supabase
        .from("task_attachments")
        .select(`
          *,
          tasks!inner(title)
        `)
        .gte('created_at', sevenDaysAgo.toISOString());

      if (attachmentsError) throw attachmentsError;

      // Fetch recent link additions
      const { data: links, error: linksError } = await supabase
        .from("task_links")
        .select(`
          *,
          tasks!inner(title)
        `)
        .gte('created_at', sevenDaysAgo.toISOString());

      if (linksError) throw linksError;

      // Combine and sort all activities
      const allActivities: ActivityType[] = [
        ...(tasks || []).map(task => ({
          type: 'task' as const,
          data: task,
          date: new Date(task.updated_at),
        })),
        ...(comments || []).map(comment => ({
          type: 'comment' as const,
          data: comment,
          date: new Date(comment.created_at),
        })),
        ...(attachments || []).map(attachment => ({
          type: 'attachment' as const,
          data: attachment,
          date: new Date(attachment.created_at),
        })),
        ...(links || []).map(link => ({
          type: 'link' as const,
          data: link,
          date: new Date(link.created_at),
        })),
      ].sort((a, b) => b.date.getTime() - a.date.getTime());

      console.log("Combined activities:", allActivities);
      return allActivities;
    },
  });
}