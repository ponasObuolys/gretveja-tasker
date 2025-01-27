import { Task } from './types';
import { TaskLinks } from './TaskLinks';
import TaskDescription from './TaskDescription';
import TaskAttachments from './TaskAttachments';
import TaskComments from './TaskComments';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

function TaskDetailsContent({ task, isAdmin }: { task: Task; isAdmin: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id);

      if (error) throw error;

      toast({
        title: 'Užduotis ištrinta',
        description: 'Užduotis sėkmingai ištrinta',
      });

      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Klaida',
        description: 'Nepavyko ištrinti užduoties',
        variant: 'destructive',
      });
    }
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
        <span>Sukūrė: {task.created_by}</span>
        <span>Sukurta: {new Date(task.created_at).toLocaleDateString('lt-LT')}</span>
      </div>

      <div className="task-body">
        <TaskDescription task={task} />
        <TaskAttachments taskId={task.id} />
        <TaskLinks taskId={task.id} isAdmin={isAdmin} />
        <TaskComments taskId={task.id} isAdmin={isAdmin} />
      </div>
    </div>
  );
}

export default TaskDetailsContent;