import { CheckCircle, Clock, AlertCircle, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type TaskWithProfile = Tables<"tasks"> & {
  created_by_profile: {
    email: string | null;
  } | null;
  moved_by_profile: {
    email: string | null;
  } | null;
};

export function RecentActivity() {
  const { data: tasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          created_by_profile:profiles!tasks_created_by_fkey(email),
          moved_by_profile:profiles!tasks_moved_by_fkey(email)
        `)
        .order('updated_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return (data || []) as unknown as TaskWithProfile[];
    },
  });

  const getStatusIcon = (status: Tables<"tasks">["status"]) => {
    switch (status) {
      case "PADARYTA":
        return CheckCircle;
      case "ATMESTA":
        return AlertCircle;
      case "VYKDOMA":
        return ArrowRight;
      default:
        return Clock;
    }
  };

  const getStatusMessage = (task: TaskWithProfile) => {
    switch (task.status) {
      case "PADARYTA":
        return `Užduotis "${task.title}" pažymėta kaip atlikta`;
      case "ATMESTA":
        return `Užduotis "${task.title}" atmesta`;
      case "VYKDOMA":
        return `Užduotis "${task.title}" pradėta vykdyti`;
      case "REIKIA_PADARYTI":
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
          Rodyti viską
        </button>
      </div>

      <div className="space-y-4">
        {tasks?.map((task) => {
          const Icon = getStatusIcon(task.status);
          return (
            <div
              key={task.id}
              className="flex items-start space-x-3 text-sm"
            >
              <Icon className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-gray-300">{getStatusMessage(task)}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {new Date(task.updated_at).toLocaleString('lt-LT', {
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