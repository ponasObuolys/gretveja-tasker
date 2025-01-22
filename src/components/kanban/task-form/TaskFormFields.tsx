import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TaskPriorityField } from "../TaskPriorityField";
import { TaskFileUploadField } from "../TaskFileUploadField";
import { UseFormReturn } from "react-hook-form";
import { TaskFormValues } from "./types";

interface TaskFormFieldsProps {
  form: UseFormReturn<TaskFormValues>;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function TaskFormFields({ form, onFileChange }: TaskFormFieldsProps) {
  console.log("TaskFormFields form context:", form); // Debug log

  return (
    <>
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
      <TaskPriorityField />
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
      <TaskFileUploadField onFileChange={onFileChange} />
    </>
  );
}