import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps {
  isUploading: boolean;
  disabled: boolean;
  onClick: () => void;
}

export function SubmitButton({ isUploading, disabled, onClick }: SubmitButtonProps) {
  return (
    <Button
      type="button"
      disabled={disabled || isUploading}
      className="w-full"
      onClick={onClick}
    >
      {isUploading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Įkeliama...
        </>
      ) : (
        "Pridėti komentarą"
      )}
    </Button>
  );
}