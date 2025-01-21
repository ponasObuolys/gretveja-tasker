import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { memo } from "react";

interface LoadingSpinnerProps {
  className?: string;
}

export const LoadingSpinner = memo(function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Loader2 className={cn("h-8 w-8 animate-spin text-primary", className)} />
    </div>
  );
});