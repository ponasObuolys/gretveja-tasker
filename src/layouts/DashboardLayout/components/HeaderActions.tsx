import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

export function HeaderActions() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon">
        <Bell className="h-5 w-5" />
      </Button>
    </div>
  );
}

export default HeaderActions;