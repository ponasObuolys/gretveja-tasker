import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

function TaskComments({ taskId, isAdmin }: { taskId: string; isAdmin: boolean }) {
  const { toast } = useToast();

  const { data: comments } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="task-comments">
      <h4>Komentarai</h4>
      {comments?.map((comment) => (
        <div key={comment.id} className="comment">
          <p>{comment.comment}</p>
        </div>
      ))}
    </div>
  );
}

export default TaskComments;