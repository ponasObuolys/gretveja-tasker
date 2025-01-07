import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const taskSchema = z.object({
  title: z.string().min(1, "Pavadinimas yra privalomas"),
  description: z.string().optional(),
  priority: z.coerce.number().min(1).max(5).default(1),
  deadline: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

export function CreateTaskDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: 1,
      deadline: "",
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const uploadFiles = async (taskId: string, userId: string) => {
    for (const file of selectedFiles) {
      const fileExt = file.name.split(".").pop();
      const filePath = `${taskId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("task_attachments")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Error uploading file:", uploadError);
        continue;
      }

      const { error: dbError } = await supabase.from("attachments").insert({
        task_id: taskId,
        file_path: filePath,
        file_name: file.name,
        content_type: file.type,
        created_by: userId,
      });

      if (dbError) {
        console.error("Error saving attachment metadata:", dbError);
      }
    }
  };

  const onSubmit = async (data: TaskFormValues) => {
    try {
      setIsSubmitting(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("No authenticated user found");
      }

      const { data: task, error } = await supabase
        .from("tasks")
        .insert({
          title: data.title,
          description: data.description,
          priority: data.priority,
          deadline: data.deadline || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      if (selectedFiles.length > 0 && task) {
        await uploadFiles(task.id, user.id);
      }

      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: "Užduotis sukurta",
        description: "Užduotis sėkmingai sukurta",
      });
      form.reset();
      setSelectedFiles([]);
      setOpen(false);
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko sukurti užduoties",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nauja užduotis
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sukurti naują užduotį</DialogTitle>
        </DialogHeader>
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
                  <FormMessage />
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioritetas (1-5)</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={5} {...field} />
                  </FormControl>
                  <FormMessage />
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Prisegti failai</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </FormControl>
            </FormItem>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Kuriama..." : "Sukurti"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}