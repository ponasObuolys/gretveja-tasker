import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";

interface TaskStatusButtonsProps {
  isAdmin: boolean;
  currentStatus: Tables<"tasks">["status"];
  onStatusChange: (status: Tables<"tasks">["status"]) => void;
}

export function TaskStatusButtons({
  isAdmin,
  currentStatus,
  onStatusChange
}: TaskStatusButtonsProps) {
  if (!isAdmin) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={currentStatus === "NAUJOS" ? "default" : "outline"}
        onClick={() => onStatusChange("NAUJOS")}
      >
        Naujos
      </Button>
      <Button
        variant={currentStatus === "VYKDOMOS" ? "default" : "outline"}
        onClick={() => onStatusChange("VYKDOMOS")}
      >
        Vykdomos
      </Button>
      <Button
        variant={currentStatus === "NUKELTOS" ? "default" : "outline"}
        onClick={() => onStatusChange("NUKELTOS")}
      >
        Nukeltos
      </Button>
      <Button
        variant={currentStatus === "VELUOJANCIOS" ? "default" : "outline"}
        onClick={() => onStatusChange("VELUOJANCIOS")}
      >
        Vėluojančios
      </Button>
      <Button
        variant={currentStatus === "IVYKDYTOS" ? "default" : "outline"}
        onClick={() => onStatusChange("IVYKDYTOS")}
      >
        Įvykdytos
      </Button>
      <Button
        variant={currentStatus === "ATMESTOS" ? "default" : "outline"}
        onClick={() => onStatusChange("ATMESTOS")}
      >
        Atmestos
      </Button>
    </div>
  );
}