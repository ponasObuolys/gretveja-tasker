import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSessionCheck } from "@/utils/sessionUtils";
import { useToast } from "@/hooks/use-toast";

export type Profile = {
  id: string;
  email: string | null;
  role: string | null;
  avatar_url: string | null;
  first_name: string | null;
  last_name: string | null;
  notify_new_tasks: boolean;
  notify_overdue_tasks: boolean;
  created_at: string;
  updated_at: string;
};

export default function Settings() {
  const navigate = useNavigate();
  const sessionCheck = useSessionCheck(navigate);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: profile, error: profileError, isLoading } = useQuery({
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
      
      console.log("Profile data fetched:", data);
      return data as Profile;
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const updates = {
        first_name: formData.get('firstName')?.toString() || null,
        last_name: formData.get('lastName')?.toString() || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({
        title: "Nuotrauka atnaujinta",
        description: "Jūsų profilio nuotrauka sėkmingai atnaujinta.",
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko įkelti nuotraukos. Bandykite dar kartą.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateProfileMutation.mutate(formData);
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
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
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
                        disabled={isSubmitting}
                      />
                    </label>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Vardas</label>
                      <Input
                        name="firstName"
                        defaultValue={profile?.first_name || ''}
                        className="bg-[#1A1D24]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Pavardė</label>
                      <Input
                        name="lastName"
                        defaultValue={profile?.last_name || ''}
                        className="bg-[#1A1D24]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">El. paštas</label>
                      <Input
                        value={profile?.email || ''}
                        readOnly
                        className="bg-[#1A1D24]"
                      />
                    </div>
                  </div>
                </div>
                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? "Saugoma..." : "Išsaugoti pakeitimus"}
                </Button>
              </form>
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
                      queryClient.invalidateQueries({ queryKey: ["profile"] });
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
                      queryClient.invalidateQueries({ queryKey: ["profile"] });
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