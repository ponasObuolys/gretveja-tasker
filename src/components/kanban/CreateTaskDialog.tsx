import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { TaskFormFields } from "./task-form/TaskFormFields";
import { useTaskForm } from "./task-form/useTaskForm";
import { useState } from "react";
import { Form } from "@/components/ui/form";

export function CreateTaskDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const { form, isSubmitting, selectedFiles, handleFileChange, onSubmit } = useTaskForm(() => {
    setIsOpen(false);
  });

  console.log("Form context:", form); // Debug log to verify form initialization

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          size="lg"
          className="fixed bottom-20 right-4 sm:relative sm:bottom-auto sm:right-auto rounded-full sm:rounded-lg shadow-lg hover:shadow-xl transition-shadow px-6 py-6 sm:py-2 z-10"
        >
          <Plus className="h-5 w-5 sm:mr-2" />
          <span className="hidden sm:inline">Nauja užduotis</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <TaskFormFields form={form} onFileChange={handleFileChange} />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              Sukurti
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}