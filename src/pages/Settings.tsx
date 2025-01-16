import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSessionCheck } from "@/utils/sessionUtils";

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
  const [name, setName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      console.log("Avatar uploaded successfully");
    } catch (error) {
      console.error("Error uploading avatar:", error);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      console.error("Passwords don't match");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setNewPassword("");
      setConfirmPassword("");
      console.log("Password updated successfully");
    } catch (error) {
      console.error("Error updating password:", error);
    }
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

        <div className="space-y-6">
          <h1 className="text-2xl font-bold mb-6">Nustatymai</h1>
          
          {/* Profile Section */}
          <Card className="bg-[#242832] border-none">
            <CardHeader>
              <h2 className="text-xl font-semibold">Profilis</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile?.avatar_url || ''} alt="Avatar" />
                    <AvatarFallback>{profile?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 p-1 bg-primary rounded-full cursor-pointer">
                    <Camera className="h-4 w-4 text-white" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                    />
                  </label>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">El. paštas</label>
                  <Input
                    value={profile?.email || ''}
                    readOnly
                    className="bg-[#1A1D24]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card className="bg-[#242832] border-none">
            <CardHeader>
              <h2 className="text-xl font-semibold">Saugumas</h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Naujas slaptažodis</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-[#1A1D24]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pakartokite slaptažodį</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-[#1A1D24]"
                  />
                </div>
                <Button type="submit">Atnaujinti slaptažodį</Button>
              </form>
            </CardContent>
          </Card>

          {/* Notifications Section */}
          <Card className="bg-[#242832] border-none">
            <CardHeader>
              <h2 className="text-xl font-semibold">Pranešimai</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Naujos užduotys</label>
                <Switch
                  checked={profile?.notify_new_tasks}
                  onCheckedChange={async (checked) => {
                    try {
                      const { error } = await supabase
                        .from('profiles')
                        .update({ notify_new_tasks: checked })
                        .eq('id', profile?.id);

                      if (error) throw error;
                    } catch (error) {
                      console.error("Error updating notification preference:", error);
                    }
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Vėluojančios užduotys</label>
                <Switch
                  checked={profile?.notify_overdue_tasks}
                  onCheckedChange={async (checked) => {
                    try {
                      const { error } = await supabase
                        .from('profiles')
                        .update({ notify_overdue_tasks: checked })
                        .eq('id', profile?.id);

                      if (error) throw error;
                    } catch (error) {
                      console.error("Error updating notification preference:", error);
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}