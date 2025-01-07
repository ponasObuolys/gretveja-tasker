import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/pages/Settings";

interface ProfileFormProps {
  profile: Profile;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function ProfileForm({ profile, isSubmitting, onSubmit }: ProfileFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="space-y-4">
        <div>
          <Label htmlFor="email">El. paštas</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={profile?.email || ''}
            className="bg-[#1A1D24]"
          />
        </div>

        <div>
          <Label htmlFor="role">Pareigos</Label>
          <Input
            id="role"
            name="role"
            defaultValue={profile?.role || ''}
            className="bg-[#1A1D24]"
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saugoma..." : "Išsaugoti pakeitimus"}
      </Button>
    </form>
  );
}