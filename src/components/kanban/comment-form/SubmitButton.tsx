import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps {
  isUploading: boolean;
  disabled: boolean;
}

export function SubmitButton({ isUploading, disabled }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={disabled || isUploading}
      className="w-full"
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