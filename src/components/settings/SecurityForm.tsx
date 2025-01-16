import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PasswordChangeForm } from "./PasswordChangeForm";

export function SecurityForm() {
  const { toast } = useToast();

  const handlePasswordChange = async (values: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword
      });

      if (error) throw error;

      toast({
        title: "Slaptažodis pakeistas",
        description: "Jūsų slaptažodis sėkmingai atnaujintas",
      });
    } catch (error) {
      console.error("Error updating password:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko pakeisti slaptažodžio",
        variant: "destructive",
      });
    }
  };

  return <PasswordChangeForm onSubmit={handlePasswordChange} />;
}