import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./layouts/DashboardLayout";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/auth/callback";
import { createQueryClient } from "./utils/queryClientConfig";
import { useAuthManagement } from "./hooks/useAuthManagement";
import { initSentry } from "./utils/sentry";
import * as Sentry from "@sentry/react";

// Initialize Sentry as early as possible
if (import.meta.env.PROD) {
  initSentry();
}

const queryClient = createQueryClient();

const AppRoutes = () => {
  const { initializeAuth, setupAuthListener } = useAuthManagement({ queryClient });

  useEffect(() => {
    console.log("Starting auth initialization in AppRoutes");
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 5; // Increased from 3 to 5
    const retryDelay = 3000; // Increased from 2000 to 3000
    
    const isNetworkError = (error: any) => {
      return (
        error.message === "Failed to fetch" ||
        error.message?.includes("network") ||
        error.error_type === "http_server_error"
      );
    };

    const retryAuth = async () => {
      if (!mounted) {
        console.log("Component unmounted, stopping auth initialization");
        return;
      }

      try {
        console.log(`Auth initialization attempt ${retryCount + 1}`);
        await initializeAuth();
        console.log("Auth initialization successful");
      } catch (error: any) {
        console.error(`Auth initialization attempt ${retryCount + 1} failed:`, error);
        
        // Special handling for network errors
        if (isNetworkError(error)) {
          console.log("Network error detected, will retry");
          if (retryCount < maxRetries && mounted) {
            retryCount++;
            const exponentialDelay = retryDelay * Math.pow(2, retryCount - 1);
            console.log(`Retrying auth initialization in ${exponentialDelay}ms (attempt ${retryCount})`);
            setTimeout(retryAuth, exponentialDelay);
          } else {
            console.error("Max retries reached for auth initialization");
            if (import.meta.env.PROD) {
              Sentry.captureException(error, {
                level: 'error',
                tags: {
                  type: 'auth_initialization_failed',
                  retryCount: retryCount.toString(),
                  errorType: 'network_error'
                }
              });
            }
          }
        } else {
          // Non-network errors
          console.error("Non-network error during auth initialization:", error);
          if (import.meta.env.PROD) {
            Sentry.captureException(error, {
              level: 'error',
              tags: {
                type: 'auth_initialization_failed',
                errorType: 'non_network_error'
              }
            });
          }
        }
      }
    };

    retryAuth();

    const { data: { subscription } } = setupAuthListener();

    return () => {
      mounted = false;
      console.log("Cleaning up auth subscription in AppRoutes");
      subscription.unsubscribe();
    };
  }, [initializeAuth, setupAuthListener]);

  return (
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
  );
};

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppRoutes />
      </TooltipProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;