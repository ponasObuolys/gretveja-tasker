import { useDropzone } from 'react-dropzone';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

function TaskAttachments({ taskId }: { taskId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileUpload = async (files: File[]) => {
    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${taskId}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('task_attachments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('task_attachments')
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from('task_attachments')
          .insert({
            task_id: taskId,
            file_name: file.name,
            file_url: publicUrl,
          });

        if (dbError) throw dbError;
      }

      toast({
        title: 'Failai įkelti',
        description: 'Failai sėkmingai įkelti',
      });

      queryClient.invalidateQueries({ queryKey: ['task-attachments'] });
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: 'Klaida',
        description: 'Nepavyko įkelti failų',
        variant: 'destructive',
      });
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleFileUpload,
    multiple: true,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt']
    }
  });

  return (
    <div className="task-attachments">
      <h4>Prisegti failai</h4>
      <div {...getRootProps()} className="upload-zone">
        <input {...getInputProps()} />
        <p>Tempkite failus čia arba paspauskite norėdami įkelti</p>
      </div>
      <div className="attachment-list">
        {/* Here you can render the list of uploaded attachments */}
      </div>
    </div>
  );
}

export default TaskAttachments;
