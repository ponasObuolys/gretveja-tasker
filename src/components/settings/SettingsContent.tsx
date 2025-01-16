import { useState } from "react";
import { AvatarUpload } from "./AvatarUpload";
import { ProfileForm } from "./ProfileForm";
import { SecurityForm } from "./SecurityForm";
import { NotificationPreferences } from "./NotificationPreferences";
import { useProfileUpdate } from "@/hooks/useProfileUpdate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Profile } from "@/pages/Settings";

interface SettingsContentProps {
  profile: Profile;
}

export function SettingsContent({ profile }: SettingsContentProps) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
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

  return (
    <div className="bg-[#242832] rounded-lg p-8">
      <h1 className="text-2xl font-bold mb-8">Nustatymai</h1>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-3 gap-4">
          <TabsTrigger value="profile">Profilis</TabsTrigger>
          <TabsTrigger value="security">Saugumas</TabsTrigger>
          <TabsTrigger value="notifications">Pranešimai</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="security">
          <SecurityForm />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationPreferences profile={profile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}