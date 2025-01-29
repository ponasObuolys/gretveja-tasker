import { useEffect, useState } from "react";
import { AuthContainer } from "./AuthContainer";
import { Alert } from "@/components/ui/alert";

const LOADING_TIMEOUT = 5000; // 5 seconds timeout

export const AuthLoading = () => {
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setShowTimeout(true);
    }, LOADING_TIMEOUT);

    return () => clearTimeout(timeoutId);
  }, []);

  if (showTimeout) {
    return (
      <AuthContainer>
        <Alert variant="destructive" className="mb-4">
          <p>Prisijungimas užtrunka ilgiau nei įprasta. Bandykite atnaujinti puslapį.</p>
        </Alert>
      </AuthContainer>
    );
  }

  return (
    <AuthContainer>
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Kraunama...</span>
      </div>
    </AuthContainer>
  );
};