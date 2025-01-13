import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSessionCheck } from "@/utils/sessionUtils";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { AvatarUpload } from "@/components/settings/AvatarUpload";
import { useProfileUpdate } from "@/hooks/useProfileUpdate";

export type Profile = {
  id: string;
  email: string | null;
  role: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export default function Settings() {
  const navigate = useNavigate();
  const sessionCheck = useSessionCheck(navigate);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
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

  const { updateProfile, isSubmitting } = useProfileUpdate(profile, avatarFile);

  const handleAvatarChange = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setAvatarFile(file);
  };

  const handleSubmit = (values: { email?: string; role?: string }) => {
    console.log("Form values:", values);
    const formData = new FormData();
    formData.append('email', values.email || '');
    formData.append('role', values.role || '');
    updateProfile(formData);
  };

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

        <div className="bg-[#242832] rounded-lg p-8">
          <h1 className="text-2xl font-bold mb-8">Profilio nustatymai</h1>

          {profile && (
            <>
              <AvatarUpload
                profile={profile}
                onAvatarChange={handleAvatarChange}
                avatarPreview={avatarPreview}
              />
              <ProfileForm
                profile={profile}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}