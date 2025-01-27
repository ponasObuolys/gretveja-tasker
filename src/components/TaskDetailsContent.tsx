import { TaskLinks } from './TaskLinks';

function TaskDetailsContent({ task }: { task: Task }) {
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
        <span>Sukūrė: {task.created_by}</span>
        <span>Sukurta: {new Date(task.created_at).toLocaleDateString('lt-LT')}</span>
      </div>

      <div className="task-body">
        <TaskDescription task={task} />
        <TaskAttachments taskId={task.id} />
        <TaskLinks taskId={task.id} />
        <TaskComments taskId={task.id} />
      </div>
    </div>
  );
}

export default TaskDetailsContent; 