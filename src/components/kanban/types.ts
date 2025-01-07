import { Json } from "@/integrations/supabase/types";

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  attachments: Json;
  links: string[];
  profiles?: {
    email: string | null;
  } | null;
}