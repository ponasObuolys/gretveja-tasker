import { memo } from "react";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage = memo(function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-destructive text-destructive-foreground px-6 py-4 rounded-lg shadow-lg space-y-2">
        <p className="text-center">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full mt-2 px-4 py-2 bg-background/20 hover:bg-background/30 rounded transition-colors"
          >
            Bandyti dar kartą
          </button>
        )}
      </div>
    </div>
  );
});