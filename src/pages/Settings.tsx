import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
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

  const updateProfileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}/avatar.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });
          
        if (uploadError) throw uploadError;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          email: formData.get('email'),
          role: formData.get('role'),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Profilis atnaujintas",
        description: "Jūsų profilio pakeitimai išsaugoti sėkmingai.",
      });
    },
    onError: (error) => {
      toast({
        title: "Klaida",
        description: "Nepavyko atnaujinti profilio. Bandykite dar kartą.",
        variant: "destructive",
      });
      console.error("Profile update error:", error);
    },
  });

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Klaida",
        description: "Nuotrauka negali būti didesnė nei 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setAvatarFile(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateProfileMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Kraunama...</div>;
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

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex flex-col items-center mb-8">
              <div className="relative group">
                <Avatar className="w-40 h-40">
                  <AvatarImage src={avatarPreview || profile?.avatar_url} />
                  <AvatarFallback>
                    {profile?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                >
                  <Camera className="w-8 h-8" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Rekomenduojamas dydis: 150x150px
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="email">El. paštas</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={profile?.email}
                  className="bg-[#1A1D24]"
                />
              </div>

              <div>
                <Label htmlFor="role">Pareigos</Label>
                <Input
                  id="role"
                  name="role"
                  defaultValue={profile?.role}
                  className="bg-[#1A1D24]"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? "Saugoma..." : "Išsaugoti pakeitimus"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}