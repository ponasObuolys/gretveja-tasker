import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Profile } from "@/pages/Settings";

export const useProfileUpdate = (profile: Profile | undefined, avatarFile: File | null) => {
  const { toast } = useToast();

  const updateProfileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      console.log("Starting profile update");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      let avatarUrl = profile?.avatar_url;

      if (avatarFile) {
        console.log("Uploading new avatar");
        
        // Delete old avatar if exists
        if (profile?.avatar_url) {
          const oldFilePath = profile.avatar_url.split('/').pop();
          if (oldFilePath) {
            await supabase.storage
              .from('avatars')
              .remove([oldFilePath]);
          }
        }

        const filePath = `${user.id}/avatar.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { 
            contentType: 'image/jpeg',
            upsert: true 
          });
          
        if (uploadError) {
          console.error("Avatar upload error:", uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        avatarUrl = publicUrl;
        console.log("New avatar URL:", avatarUrl);
      }

      const email = formData.get('email')?.toString();
      const role = formData.get('role')?.toString() as "ADMIN" | "USER" | null;
      const firstName = formData.get('first_name')?.toString();
      const lastName = formData.get('last_name')?.toString();

      console.log("Updating profile with:", { email, role, avatarUrl, firstName, lastName });
      const { error } = await supabase
        .from('profiles')
        .update({
          email,
          role,
          avatar_url: avatarUrl,
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error("Profile update error:", error);
        throw error;
      }
      console.log("Profile updated successfully");
    },
    onSuccess: () => {
      toast({
        title: "Profilis atnaujintas",
        description: "Jūsų profilio pakeitimai išsaugoti sėkmingai.",
      });
    },
    onError: (error) => {
      console.error("Profile update error:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko atnaujinti profilio. Bandykite dar kartą.",
        variant: "destructive",
      });
    },
  });

  return {
    updateProfile: (formData: FormData) => {
      updateProfileMutation.mutate(formData);
    },
    isSubmitting: updateProfileMutation.isPending,
  };
};