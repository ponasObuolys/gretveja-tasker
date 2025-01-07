import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function UserProfile() {
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="text-center mb-8">
      <Avatar className="w-20 h-20 mx-auto mb-4">
        <AvatarImage src="/placeholder.svg" />
        <AvatarFallback>UN</AvatarFallback>
      </Avatar>
      
      <h3 className="font-medium text-lg mb-1">{profile?.email}</h3>
      <p className="text-gray-400 text-sm mb-6">{profile?.role}</p>
      
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="font-medium">12</div>
          <div className="text-gray-400">Aktyvios</div>
        </div>
        <div>
          <div className="font-medium">48</div>
          <div className="text-gray-400">Atliktos</div>
        </div>
        <div>
          <div className="font-medium">80%</div>
          <div className="text-gray-400">Sėkmės</div>
        </div>
      </div>
    </div>
  );
}