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
  const [isEditing, setIsEditing] = useState(false);
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

  const onSubmit = async (values: any) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          title: values.title,
          description: values.description,
          deadline: values.deadline,
          updated_at: new Date().toISOString(),
        })
        .eq("id", task.id);

      if (error) throw error;

      toast({
        title: "Užduotis atnaujinta",
        description: "Užduoties informacija sėkmingai atnaujinta",
      });

      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko atnaujinti užduoties",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      {isAdmin && !isEditing && (
        <Button onClick={() => setIsEditing(true)} className="w-full">
          Redaguoti užduotį
        </Button>
      )}

      {isEditing && isAdmin ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pavadinimas</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aprašymas</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terminas</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Išsaugoti
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="flex-1"
              >
                Atšaukti
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <>
          <div className="space-y-2">
            <h3 className="font-medium">Aprašymas</h3>
            <p className="text-sm text-gray-200 whitespace-pre-wrap">
              {task.description || "Nėra aprašymo"}
            </p>
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
        </>
      )}

      <TaskStatusButtons
        isAdmin={isAdmin}
        currentStatus={task.status}
        onStatusChange={handleStatusChange}
      />

      {isAdmin && (
        <div className="flex justify-end">
          <TaskDeleteButton onDelete={onDelete} />
        </div>
      )}

      <TaskComments taskId={task.id} isAdmin={isAdmin} />
    </div>
  );
}