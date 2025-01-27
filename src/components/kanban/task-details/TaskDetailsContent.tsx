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
  const [editingField, setEditingField] = useState<'title' | 'description' | 'deadline' | null>(null);
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
    field: 'title' | 'description' | 'deadline',
    label: string,
    currentValue: string,
    inputType: 'text' | 'textarea' | 'datetime-local'
  ) => {
    const isEditing = editingField === field;

    if (!isEditing) {
      return (
        <div className="flex items-start justify-between group">
          <div className="space-y-1 flex-1">
            <div className="font-medium text-sm">{label}</div>
            <div className="text-sm text-gray-200">
              {field === 'deadline' && currentValue 
                ? format(new Date(currentValue), "yyyy-MM-dd HH:mm")
                : currentValue || "Nėra"}
            </div>
          </div>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditingField(field)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
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
                <FormLabel>{label}</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    {inputType === 'textarea' ? (
                      <Textarea {...formField} className="resize-none" />
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
  };

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      <div className="space-y-4">
        {renderEditableField('title', 'Pavadinimas', task.title, 'text')}
        {renderEditableField('description', 'Aprašymas', task.description || '', 'textarea')}
        {renderEditableField('deadline', 'Terminas', task.deadline || '', 'datetime-local')}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Prisegti dokumentai:</h3>
        <TaskAttachments
          isAdmin={isAdmin}
          attachments={task.task_attachments}
          onDeleteFile={handleDeleteFile}
          taskId={task.id}
        />
      </div>

      <TaskStatusButtons
        isAdmin={isAdmin}
        currentStatus={task.status}
        onStatusChange={handleStatusChange}
      />

      {isAdmin && (
        <div className="flex justify-end">
          <TaskDeleteButton isAdmin={isAdmin} onDelete={onDelete} />
        </div>
      )}

      <TaskComments taskId={task.id} isAdmin={isAdmin} />
    </div>
  );
}