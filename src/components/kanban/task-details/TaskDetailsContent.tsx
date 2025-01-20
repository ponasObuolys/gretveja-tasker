import { Tables } from "@/integrations/supabase/types";
import { TaskHeader } from "./TaskHeader";
import { TaskAttachments } from "./TaskAttachments";
import { TaskAttachmentSection } from "./TaskAttachmentSection";
import { TaskStatusButtons } from "./TaskStatusButtons";
import { TaskComments } from "../TaskComments";

interface TaskDetailsContentProps {
  task: Tables<"tasks"> & {
    created_by_profile?: {
      email: string | null;
    } | null;
    moved_by_profile?: {
      email: string | null;
    } | null;
    task_attachments?: {
      id: string;
      file_name: string;
      file_url: string;
    }[];
  };
  isAdmin: boolean;
  isUploading: boolean;
  onUploadStart: () => void;
  onUploadEnd: () => void;
  handleDeleteFile: (attachmentId: string) => void;
  handleStatusChange: (status: Tables<"tasks">["status"]) => void;
}

export function TaskDetailsContent({
  task,
  isAdmin,
  isUploading,
  onUploadStart,
  onUploadEnd,
  handleDeleteFile,
  handleStatusChange,
}: TaskDetailsContentProps) {
  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      <TaskHeader task={task} />

      {task.task_attachments && task.task_attachments.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Prisegti dokumentai:</h3>
          <TaskAttachments
            isAdmin={isAdmin}
            attachments={task.task_attachments}
            onDeleteFile={handleDeleteFile}
            taskId={task.id}
          />
        </div>
      )}

      {isAdmin && (
        <TaskAttachmentSection
          taskId={task.id}
          isAdmin={isAdmin}
          onUploadStart={onUploadStart}
          onUploadEnd={onUploadEnd}
        />
      )}

      <TaskStatusButtons
        isAdmin={isAdmin}
        currentStatus={task.status}
        onStatusChange={handleStatusChange}
      />

      <TaskComments taskId={task.id} isAdmin={isAdmin} />
    </div>
  );
}