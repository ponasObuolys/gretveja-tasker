export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  created_by: string;
  created_at: string;
  deadline?: string;
  priority?: number;
}