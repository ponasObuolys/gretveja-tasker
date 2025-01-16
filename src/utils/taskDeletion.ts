import { supabase } from "@/integrations/supabase/client";
import { ToastProps } from "@/components/ui/toast";

interface DeleteTasksResult {
  success: boolean;
  message: string;
}

export async function deleteSelectedTasks(
  selectedTasks: string[],
  toast: (props: ToastProps) => void
): Promise<DeleteTasksResult> {
  if (selectedTasks.length === 0) {
    return { success: false, message: "No tasks selected" };
  }

  try {
    console.log("Starting deletion process for tasks:", selectedTasks);
    
    // Delete task links first
    const { error: linksError } = await supabase
      .from("task_links")
      .delete()
      .in("task_id", selectedTasks);

    if (linksError) {
      console.error("Error deleting task links:", linksError);
      return { 
        success: false, 
        message: "Nepavyko ištrinti nuorodų" 
      };
    }

    console.log("Successfully deleted task links");

    // Delete task comments
    const { error: commentsError } = await supabase
      .from("task_comments")
      .delete()
      .in("task_id", selectedTasks);

    if (commentsError) {
      console.error("Error deleting task comments:", commentsError);
      return { 
        success: false, 
        message: "Nepavyko ištrinti komentarų" 
      };
    }

    console.log("Successfully deleted task comments");

    // Delete task attachments
    const { error: attachmentsError } = await supabase
      .from("task_attachments")
      .delete()
      .in("task_id", selectedTasks);

    if (attachmentsError) {
      console.error("Error deleting task attachments:", attachmentsError);
      return { 
        success: false, 
        message: "Nepavyko ištrinti priedų" 
      };
    }

    console.log("Successfully deleted task attachments");

    // Delete notifications BEFORE deleting tasks
    const { error: notificationsError } = await supabase
      .from("notifications")
      .delete()
      .in("task_id", selectedTasks);

    if (notificationsError) {
      console.error("Error deleting notifications:", notificationsError);
      return { 
        success: false, 
        message: "Nepavyko ištrinti pranešimų" 
      };
    }

    console.log("Successfully deleted notifications");

    // Finally delete the tasks
    const { error: tasksError } = await supabase
      .from("tasks")
      .delete()
      .in("id", selectedTasks);

    if (tasksError) {
      console.error("Error deleting tasks:", tasksError);
      return { 
        success: false, 
        message: "Nepavyko ištrinti užduočių" 
      };
    }

    console.log("Successfully completed task deletion");
    return { 
      success: true, 
      message: `Sėkmingai ištrinta ${selectedTasks.length} užduočių` 
    };

  } catch (error) {
    console.error("Unexpected error during deletion:", error);
    return { 
      success: false, 
      message: "Įvyko nenumatyta klaida trinant užduotis" 
    };
  }
}