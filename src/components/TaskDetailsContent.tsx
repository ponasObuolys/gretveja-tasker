import { TaskLinks } from './TaskLinks';
import { Tables } from "@/integrations/supabase/types";

interface TaskDetailsContentProps {
  task: Tables<"tasks"> & {
    created_by_profile?: {
      email: string | null;
    } | null;
  };
}

function TaskDetailsContent({ task }: TaskDetailsContentProps) {
  const handleDelete = async () => {
    // Implementation will be added when delete functionality is requested
    console.log("Delete task:", task.id);
  };

  return (
    <div className="task-details-content">
      <div className="task-header">
        <h3>{task.title}</h3>
        <button 
          className="delete-button"
          onClick={handleDelete}
        >
          Ištrinti
        </button>
      </div>
      
      <div className="task-metadata">
        <span>Sukūrė: {task.created_by_profile?.email}</span>
        <span>Sukurta: {new Date(task.created_at).toLocaleDateString('lt-LT')}</span>
      </div>

      <div className="task-body">
        <p className="task-description">{task.description}</p>
        <TaskLinks taskId={task.id} isAdmin={true} />
      </div>
    </div>
  );
}

export default TaskDetailsContent;