import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Tables } from "@/integrations/supabase/types";
import { taskSchema } from "../task-form/types";
import { TaskComments } from "../TaskComments";
import { TaskAttachments } from "./TaskAttachments";
import { TaskStatusButtons } from "./TaskStatusButtons";
import { TaskDeleteButton } from "./TaskDeleteButton";
import { TaskLinks } from "@/components/TaskLinks";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Check, X } from "lucide-react";

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
  onDelete: () => void;
}

export function TaskDetailsContent({
  task,
  isAdmin,
  isUploading,
  onUploadStart,
  onUploadEnd,
  handleDeleteFile,
  handleStatusChange,
  onDelete,
}: TaskDetailsContentProps) {
  const [editingField, setEditingField] = useState<'description' | 'deadline' | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      deadline: task.deadline ? format(new Date(task.deadline), "yyyy-MM-dd'T'HH:mm") : "",
    },
  });

  const handleFieldUpdate = async (field: string, value: any) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          [field]: value,
          updated_at: new Date().toISOString(),
        })
        .eq("id", task.id);

      if (error) throw error;

      toast({
        title: "Užduotis atnaujinta",
        description: "Užduoties informacija sėkmingai atnaujinta",
      });

      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setEditingField(null);
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko atnaujinti užduoties",
        variant: "destructive",
      });
    }
  };

  const renderEditableField = (
    field: 'description' | 'deadline',
    currentValue: string,
    inputType: 'textarea' | 'datetime-local'
  ) => {
    const isEditing = editingField === field;

    if (!isEditing) {
      return (
        <div className="group">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {field === 'description' ? (
                <p className="text-sm text-gray-200 whitespace-pre-wrap">{currentValue || "Nėra aprašymo"}</p>
              ) : (
                <div className="text-sm text-gray-200">
                  {currentValue ? format(new Date(currentValue), "yyyy-MM-dd HH:mm") : "Nėra termino"}
                </div>
              )}
            </div>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingField(field)}
                className="opacity-80 hover:opacity-100 transition-opacity"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      );
    }

    return (
      <Form {...form}>
        <form className="space-y-2">
          <FormField
            control={form.control}
            name={field}
            render={({ field: formField }) => (
              <FormItem>
                <div className="flex gap-2">
                  <FormControl>
                    {inputType === 'textarea' ? (
                      <Textarea {...formField} className="resize-none h-20" />
                    ) : (
                      <Input type={inputType} {...formField} />
                    )}
                  </FormControl>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleFieldUpdate(field, formField.value)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingField(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </FormItem>
            )}
          />
        </form>
      </Form>
    );
  }

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">{task.title}</h3>
          {isAdmin && (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingField('description')}
                className="opacity-80 hover:opacity-100 transition-opacity"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <TaskDeleteButton isAdmin={isAdmin} onDelete={onDelete} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <div>
            Sukūrė: {task.created_by_profile?.email} • {format(new Date(task.created_at), "yyyy-MM-dd HH:mm")}
          </div>
          <div className="flex items-center justify-between group">
            <div>
              {task.deadline ? (
                <>Terminas: {format(new Date(task.deadline), "yyyy-MM-dd HH:mm")}</>
              ) : (
                "Terminas nenustatytas"
              )}
            </div>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingField('deadline')}
                className="opacity-80 hover:opacity-100 transition-opacity"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {editingField === 'deadline' && renderEditableField('deadline', task.deadline || '', 'datetime-local')}
        {renderEditableField('description', task.description || '', 'textarea')}
      </div>

      <div className="space-y-6">
        <TaskAttachments
          isAdmin={isAdmin}
          attachments={task.task_attachments}
          onDeleteFile={handleDeleteFile}
          taskId={task.id}
        />

        <TaskLinks taskId={task.id} isAdmin={isAdmin} />

        <TaskStatusButtons
          isAdmin={isAdmin}
          currentStatus={task.status}
          onStatusChange={handleStatusChange}
        />

        <TaskComments taskId={task.id} isAdmin={isAdmin} />
      </div>
    </div>
  );
}