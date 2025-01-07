interface User {
  id: string;
  email: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  attachments: any;
  links: string[];
  user?: User;
}