import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { useCallback } from "react";
import { TaskPeriod } from "../types";

export const useTasksData = (selectedPeriod: TaskPeriod) => {
  const fetchTasks = useCallback(async () => {
    console.log("Fetching tasks for statistics with period:", selectedPeriod);
    const startDate = format(subDays(new Date(), parseInt(selectedPeriod)), 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .gte('created_at', `${startDate}T00:00:00Z`)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching tasks:", error);
      throw error;
    }
    console.log("Fetched tasks:", data);
    return data as Tables<"tasks">[];
  }, [selectedPeriod]);

  return useQuery({
    queryKey: ["tasks", selectedPeriod],
    queryFn: fetchTasks,
  });
};