import { CheckCircle, Clock, AlertCircle, ArrowRight, Calendar, Ban, FileText, Link2, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { subDays } from "date-fns";

type TaskWithProfile = Tables<"tasks"> & {
  created_by_profile: {
    email: string | null;
  } | null;
  moved_by_profile: {
    email: string | null;
  } | null;
};

export function RecentActivity() {
  const { data: activities } = useQuery({
    queryKey: ["activities"],
    queryFn: async () => {
      console.log("Fetching activities for the last 7 days");
      const sevenDaysAgo = subDays(new Date(), 7);
      
      // Fetch tasks with recent activity
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          *,
          created_by_profile:profiles!tasks_created_by_fkey(email),
          moved_by_profile:profiles!tasks_moved_by_fkey(email)
        `)
        .gte('updated_at', sevenDaysAgo.toISOString())
        .order('updated_at', { ascending: false });

      if (tasksError) throw tasksError;

      // Fetch recent comments
      const { data: comments, error: commentsError } = await supabase
        .from("task_comments")
        .select(`
          *,
          tasks!inner(title)
        `)
        .gte('created_at', sevenDaysAgo.toISOString());

      if (commentsError) throw commentsError;

      // Fetch recent file uploads
      const { data: attachments, error: attachmentsError } = await supabase
        .from("task_attachments")
        .select(`
          *,
          tasks!inner(title)
        `)
        .gte('created_at', sevenDaysAgo.toISOString());

      if (attachmentsError) throw attachmentsError;

      // Fetch recent link additions
      const { data: links, error: linksError } = await supabase
        .from("task_links")
        .select(`
          *,
          tasks!inner(title)
        `)
        .gte('created_at', sevenDaysAgo.toISOString());

      if (linksError) throw linksError;

      // Combine and sort all activities
      const allActivities = [
        ...(tasks || []).map(task => ({
          type: 'task',
          data: task,
          date: new Date(task.updated_at),
        })),
        ...(comments || []).map(comment => ({
          type: 'comment',
          data: comment,
          date: new Date(comment.created_at),
        })),
        ...(attachments || []).map(attachment => ({
          type: 'attachment',
          data: attachment,
          date: new Date(attachment.created_at),
        })),
        ...(links || []).map(link => ({
          type: 'link',
          data: link,
          date: new Date(link.created_at),
        })),
      ].sort((a, b) => b.date.getTime() - a.date.getTime());

      console.log("Combined activities:", allActivities);
      return allActivities;
    },
  });

  const getActivityIcon = (activity: any) => {
    switch (activity.type) {
      case 'task':
        return getStatusIcon(activity.data.status);
      case 'comment':
        return MessageSquare;
      case 'attachment':
        return FileText;
      case 'link':
        return Link2;
      default:
        return Clock;
    }
  };

  const getStatusIcon = (status: Tables<"tasks">["status"]) => {
    switch (status) {
      case "IVYKDYTOS":
        return CheckCircle;
      case "ATMESTOS":
        return AlertCircle;
      case "VYKDOMOS":
        return ArrowRight;
      case "NUKELTOS":
        return Calendar;
      case "VELUOJANCIOS":
        return Ban;
      default:
        return Clock;
    }
  };

  const getActivityMessage = (activity: any) => {
    switch (activity.type) {
      case 'task':
        return getStatusMessage(activity.data);
      case 'comment':
        return `Pridėtas komentaras prie užduoties "${activity.data.tasks.title}"`;
      case 'attachment':
        return `Įkeltas failas prie užduoties "${activity.data.tasks.title}"`;
      case 'link':
        return `Pridėta nuoroda prie užduoties "${activity.data.tasks.title}"`;
      default:
        return 'Nežinomas veiksmas';
    }
  };

  const getStatusMessage = (task: TaskWithProfile) => {
    switch (task.status) {
      case "IVYKDYTOS":
        return `Užduotis "${task.title}" pažymėta kaip įvykdyta`;
      case "ATMESTOS":
        return `Užduotis "${task.title}" atmesta`;
      case "VYKDOMOS":
        return `Užduotis "${task.title}" pradėta vykdyti`;
      case "NUKELTOS":
        return `Užduotis "${task.title}" nukelta`;
      case "VELUOJANCIOS":
        return `Užduotis "${task.title}" vėluoja`;
      case "NAUJOS":
        return `Sukurta nauja užduotis "${task.title}"`;
      default:
        return `Užduoties "${task.title}" statusas atnaujintas`;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Paskutiniai veiksmai</h3>
        <button className="text-[#FF4B6E] text-sm hover:underline">
          Paskutinės 7 d.
        </button>
      </div>

      <div className="space-y-4">
        {activities?.map((activity, index) => {
          const Icon = getActivityIcon(activity);
          return (
            <div
              key={`${activity.type}-${index}`}
              className="flex items-start space-x-3 text-sm"
            >
              <Icon className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-gray-300">{getActivityMessage(activity)}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {activity.date.toLocaleString('lt-LT', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}