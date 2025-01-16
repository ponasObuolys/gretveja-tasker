import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Profile } from "@/pages/Settings";

interface NotificationPreferencesProps {
  profile: Profile;
}

export function NotificationPreferences({ profile }: NotificationPreferencesProps) {
  const { toast } = useToast();
  const [notifyNewTasks, setNotifyNewTasks] = useState(profile.notify_new_tasks);
  const [notifyOverdueTasks, setNotifyOverdueTasks] = useState(profile.notify_overdue_tasks);

  const updatePreference = async (field: string, value: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Nustatymai atnaujinti",
        description: "Pranešimų nustatymai sėkmingai išsaugoti",
      });
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko atnaujinti nustatymų",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Naujos užduotys</Label>
          <p className="text-sm text-gray-400">
            Gauti pranešimus apie naujas užduotis
          </p>
        </div>
        <Switch
          checked={notifyNewTasks}
          onCheckedChange={(checked) => {
            setNotifyNewTasks(checked);
            updatePreference('notify_new_tasks', checked);
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Vėluojančios užduotys</Label>
          <p className="text-sm text-gray-400">
            Gauti pranešimus apie vėluojančias užduotis
          </p>
        </div>
        <Switch
          checked={notifyOverdueTasks}
          onCheckedChange={(checked) => {
            setNotifyOverdueTasks(checked);
            updatePreference('notify_overdue_tasks', checked);
          }}
        />
      </div>
    </div>
  );
}