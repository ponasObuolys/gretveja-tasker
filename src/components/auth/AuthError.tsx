import { Alert, AlertDescription } from "@/components/ui/alert";

interface AuthErrorProps {
  message: string;
}

export const AuthError = ({ message }: AuthErrorProps) => {
  return (
    <Alert variant="destructive" className="mb-4 border-red-500/50 bg-red-500/10">
      <AlertDescription className="text-red-400">
        {message}
      </AlertDescription>
    </Alert>
  );
};