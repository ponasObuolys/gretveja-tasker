import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

interface UseKanbanTaskProps {
  task: Tables<"tasks"> & {
    created_by_profile?: {
      email: string | null;
    } | null;
    moved_by_profile?: {
      email: string | null;
    } | null;
  };
  isSelectionMode?: boolean;
  onSelect?: (taskId: string) => void;
}

export function useKanbanTask({ task, isSelectionMode, onSelect }: UseKanbanTaskProps) {
  const [showModal, setShowModal] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      console.log("Fetching user profile");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (error) throw error;
      console.log("Fetched profile:", data);
      return data;
    },
  });

  const isAdmin = profile?.role === "ADMIN";

  const handleClick = (e: React.MouseEvent) => {
    if (isSelectionMode && onSelect) {
      onSelect(task.id);
    } else {
      setShowModal(true);
    }
  };

  return {
    showModal,
    setShowModal,
    isAdmin,
    handleClick,
  };
}