import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, Suspense, lazy } from "react";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoadingSpinner } from "./components/shared/LoadingSpinner";
import { createQueryClient } from "./utils/queryClientConfig";
import { useAuthManagement } from "./hooks/useAuthManagement";
import { initSentry } from "./utils/sentry";
import { ErrorBoundary } from "./components/ErrorBoundary";
import * as Sentry from "@sentry/react";
import { initializeConnectionStateListeners } from "./utils/connectionState";
import { useConnectionState } from "./utils/connectionState";
import { Alert } from "./components/ui/alert";

// Lazy load components
const DashboardLayout = lazy(() => import("./layouts/DashboardLayout"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/auth/callback"));

// Initialize Sentry as early as possible
if (import.meta.env.PROD) {
  initSentry();
}

const queryClient = createQueryClient();

const ConnectionAlert = () => {
  const { isOnline, isReconnecting } = useConnectionState();

  if (isOnline) return null;

  return (
    <Alert variant="destructive" className="fixed bottom-4 right-4 z-50 max-w-md">
      {isReconnecting ? 'Bandoma prisijungti iš naujo...' : 'Nėra interneto ryšio'}
    </Alert>
  );
};

const ErrorFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4">
    <div className="max-w-md w-full space-y-4">
      <Alert variant="destructive">
        <h2 className="text-lg font-semibold">Įvyko klaida</h2>
        <p className="text-sm">Įvyko nenumatyta klaida. Bandykite dar kartą.</p>
      </Alert>
      <button
        onClick={() => window.location.reload()}
        className="w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
      >
        Bandyti dar kartą
      </button>
    </div>
  </div>
);

const AppRoutes = () => {
  const { initializeAuth, setupAuthListener, isInitializing, hasAttemptedInitialAuth } = useAuthManagement({ queryClient });

  useEffect(() => {
    console.log("Starting auth initialization in AppRoutes");
    let mounted = true;

    const initAuth = async () => {
      if (!mounted || hasAttemptedInitialAuth) {
        return;
      }

      try {
        await initializeAuth();
      } catch (error) {
        console.error("Fatal auth initialization error:", error);
        if (import.meta.env.PROD) {
          Sentry.captureException(error, {
            level: 'error',
            tags: {
              type: 'auth_initialization_fatal'
            }
          });
        }
      }
    };

    initAuth();

    const { data: { subscription } } = setupAuthListener();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initializeAuth, setupAuthListener, hasAttemptedInitialAuth]);

  useEffect(() => {
    const cleanup = initializeConnectionStateListeners();
    return () => cleanup();
  }, []);

  if (isInitializing) {
    return <LoadingSpinner />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ErrorBoundary fallback={<ErrorFallback />}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </ErrorBoundary>
    </Suspense>
  );
};

const App = () => (
  <Sentry.ErrorBoundary
    fallback={({ error }) => (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <h2 className="text-lg font-semibold">Kritinė klaida</h2>
            <p className="text-sm">Įvyko nenumatyta klaida. Perkraukite puslapį.</p>
            {import.meta.env.DEV && (
              <pre className="mt-2 text-xs overflow-auto">
                {error.message}
              </pre>
            )}
          </Alert>
        </div>
      </div>
    )}
  >
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppRoutes />
          <Toaster />
          <Sonner />
          <ConnectionAlert />
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </Sentry.ErrorBoundary>
);

export default App;