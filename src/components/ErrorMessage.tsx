import { memo } from "react";

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage = memo(function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md shadow-lg">
        {message}
      </div>
    </div>
  );
});