import { Tables } from "@/integrations/supabase/types";

export type TaskWithProfile = Tables<"tasks"> & {
  created_by_profile: {
    email: string | null;
  } | null;
  moved_by_profile: {
    email: string | null;
  } | null;
};

export type ActivityType = {
  type: 'task' | 'comment' | 'attachment' | 'link';
  data: any;
  date: Date;
};