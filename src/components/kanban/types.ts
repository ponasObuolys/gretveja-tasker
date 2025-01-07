import { Json } from "@/integrations/supabase/types";

interface Profile {
  email: string;
  username?: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  attachments: Json;
  links: string[];
  profiles?: Profile;
}