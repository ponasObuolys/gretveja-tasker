import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/components/dashboard/UserProfile";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function RightSidebar() {
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      console.log("Fetching user profile for sidebar");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }
      console.log("Profile data fetched:", data);
      return data;
    },
  });

  const fullName = profile ? 
    `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email 
    : '';

  const avatarFallback = profile?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="hidden xl:block w-80 min-w-80 bg-[#242832] border-l border-gray-800 max-h-screen overflow-y-auto">
      <div className="p-6">
        <div className="flex flex-col items-center mb-6">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h3 className="text-lg font-medium text-white">{fullName}</h3>
            <p className="text-sm text-gray-400">{profile?.role}</p>
          </div>
        </div>
        <RecentActivity />
      </div>
    </div>
  );
}

export default RightSidebar;