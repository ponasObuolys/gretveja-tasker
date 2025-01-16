import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSessionCheck } from "@/utils/sessionUtils";
import { SettingsContent } from "@/components/settings/SettingsContent";

export type Profile = {
  id: string;
  email: string | null;
  role: string | null;
  avatar_url: string | null;
  notify_new_tasks: boolean;
  notify_overdue_tasks: boolean;
  created_at: string;
  updated_at: string;
};

export default function Settings() {
  const navigate = useNavigate();
  const sessionCheck = useSessionCheck(navigate);
  const [isLoading, setIsLoading] = useState(true);

  const { data: profile, error: profileError } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      console.log("Fetching profile data");
      await sessionCheck();
      
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
        console.error("Profile fetch error:", error);
        throw error;
      }
      
      setIsLoading(false);
      console.log("Profile data fetched:", data);
      return data as Profile;
    },
    enabled: !isLoading,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Kraunama...</div>;
  }

  if (profileError) {
    console.error("Profile fetch error:", profileError);
    return <div className="flex items-center justify-center min-h-screen">Įvyko klaida</div>;
  }

  return (
    <div className="min-h-screen bg-[#1A1D24] p-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-8 text-gray-400 hover:text-white transition-colors"
        >
          ← Grįžti atgal
        </button>

        {profile && <SettingsContent profile={profile} />}
      </div>
    </div>
  );
}