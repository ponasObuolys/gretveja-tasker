import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export type TaskWithProfile = Tables<"tasks"> & {
  created_by_profile?: {
    email: string | null;
  } | null;
  moved_by_profile?: {
    email: string | null;
  } | null;
};

export const fetchTasks = async (filter: "all" | "priority" | "recent", searchQuery?: string) => {
  console.log("TaskUtils: Fetching tasks with filter:", filter, "and search:", searchQuery);
  
  let query = supabase
    .from("tasks")
    .select(`
      *,
      created_by_profile:profiles!tasks_created_by_fkey(email),
      moved_by_profile:profiles!tasks_moved_by_fkey(email)
    `);

  if (searchQuery) {
    console.log("TaskUtils: Applying search filter with query:", searchQuery);
    
    // First get profile IDs matching the email search
    const { data: profileIds } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', `%${searchQuery}%`);
    
    const creatorIds = profileIds?.map(profile => profile.id) || [];
    
    // Apply filters for title, description, and creator IDs
    query = query.or(
      `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%${
        creatorIds.length ? `,created_by.in.(${creatorIds.join(',')})` : ''
      }`
    );
  }

  if (filter === "priority") {
    query = query.gte("priority", 3);
  } else if (filter === "recent") {
    const today = format(new Date(), "yyyy-MM-dd");
    query = query.gte("created_at", `${today}T00:00:00Z`)
      .lte("created_at", `${today}T23:59:59Z`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  
  if (error) {
    console.error("TaskUtils: Error fetching tasks:", error);
    throw error;
  }

  console.log("TaskUtils: Fetched tasks:", data?.length, "results");
  console.log("TaskUtils: First few results:", data?.slice(0, 3));
  
  return (data || []) as unknown as TaskWithProfile[];
};

export const updateTaskStatus = async (taskId: string, newStatus: Tables<"tasks">["status"]) => {
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

  if (error) throw error;
};