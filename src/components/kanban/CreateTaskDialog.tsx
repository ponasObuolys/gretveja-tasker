import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { TaskFormFields } from "./task-form/TaskFormFields";
import { useTaskForm } from "./task-form/useTaskForm";

export function CreateTaskDialog() {
  const [open, setOpen] = useState(false);
  const { form, isSubmitting, handleFileChange, onSubmit } = useTaskForm(() => setOpen(false));

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
          <form onSubmit={onSubmit} className="space-y-4">
            <TaskFormFields form={form} onFileChange={handleFileChange} />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Kuriama..." : "Sukurti"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}