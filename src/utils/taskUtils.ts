import { supabase } from "@/integrations/supabase/client";
import { TaskFilter } from "@/components/dashboard/DashboardLayout";
import { Tables } from "@/integrations/supabase/types";

const PAGE_SIZE = 20;

export type TaskWithProfile = Tables<"tasks"> & {
  created_by_profile?: {
    email: string | null;
  } | null;
  moved_by_profile?: {
    email: string | null;
  } | null;
};

export const fetchTasks = async (
  filter: TaskFilter = "all",
  searchQuery?: string,
  page: number = 1
): Promise<TaskWithProfile[]> => {
  console.log("Fetching tasks with filter:", filter, "search:", searchQuery, "page:", page);

  let query = supabase
    .from("tasks")
    .select(`
      *,
      created_by_profile:profiles!tasks_created_by_fkey(email),
      moved_by_profile:profiles!tasks_moved_by_fkey(email)
    `)
    .order('updated_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  if (filter === "recent") {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    query = query.gte('created_at', thirtyDaysAgo.toISOString());
  } else if (filter === "priority") {
    query = query.order('priority', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }

  return data as TaskWithProfile[];
};

export const updateTaskStatus = async (taskId: string, newStatus: Tables<"tasks">["status"]) => {
  console.log("Updating task status:", taskId, newStatus);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No authenticated user");

  const { error } = await supabase
    .from("tasks")
    .update({ 
      status: newStatus,
      moved_by: user.id,
      updated_at: new Date().toISOString()
    })
    .eq("id", taskId);

  if (error) {
    console.error("Error updating task status:", error);
    throw error;
  }
};