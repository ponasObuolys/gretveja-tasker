import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
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
    const maxRetries = 3;
    const retryDelay = 2000;
    
    const retryAuth = async () => {
      if (!mounted) {
        console.log("Component unmounted, stopping auth initialization");
        return;
      }

      try {
        console.log(`Auth initialization attempt ${retryCount + 1}`);
        await initializeAuth();
        console.log("Auth initialization successful");
      } catch (error) {
        console.error(`Auth initialization attempt ${retryCount + 1} failed:`, error);
        if (retryCount < maxRetries && mounted) {
          retryCount++;
          console.log(`Retrying auth initialization in ${retryDelay}ms`);
          setTimeout(retryAuth, retryDelay);
        } else {
          console.error("Max retries reached for auth initialization");
          if (import.meta.env.PROD) {
            Sentry.captureException(error, {
              level: 'error',
              tags: {
                type: 'auth_initialization_failed',
                retryCount: retryCount.toString()
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