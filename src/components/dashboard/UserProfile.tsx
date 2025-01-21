import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function UserProfile() {
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      console.log("Fetching user profile");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("No user found");
        throw new Error("No user found");
      }
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }
      console.log("Fetched profile:", data);
      return data;
    },
  });

  const { data: tasks } = useQuery({
    queryKey: ["all-tasks"],
    queryFn: async () => {
      console.log("Fetching all tasks for statistics");
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching tasks:", error);
        throw error;
      }
      console.log("Fetched tasks for statistics:", data);
      return data;
    },
  });

  const activeTasks = tasks?.filter(task => 
    task.status === "NAUJOS" || task.status === "VYKDOMOS"
  ).length ?? 0;

  const completedTasks = tasks?.filter(task => 
    task.status === "IVYKDYTOS"
  ).length ?? 0;

  const totalTasksWithOutcome = tasks?.filter(task => 
    task.status === "IVYKDYTOS" || task.status === "ATMESTOS"
  ).length ?? 0;

  const successRate = totalTasksWithOutcome > 0
    ? Math.round((completedTasks / totalTasksWithOutcome) * 100)
    : 0;

  const avatarUrl = profile?.avatar_url 
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_url}`
    : null;

  console.log("Avatar URL:", avatarUrl);

  return (
    <div className="text-center mb-8">
      <Avatar className="w-20 h-20 mx-auto mb-4">
        <AvatarImage src={avatarUrl || "/placeholder.svg"} />
        <AvatarFallback>
          {profile?.email?.charAt(0).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      
      <h3 className="font-medium text-lg mb-1">{profile?.email}</h3>
      <p className="text-gray-400 text-sm mb-6">{profile?.role}</p>
      
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="font-medium">{activeTasks}</div>
          <div className="text-gray-400">Aktyvios</div>
        </div>
        <div>
          <div className="font-medium">{completedTasks}</div>
          <div className="text-gray-400">Atliktos</div>
        </div>
        <div>
          <div className="font-medium">{successRate}%</div>
          <div className="text-gray-400">Sėkmės</div>
        </div>
      </div>
    </div>
  );
}