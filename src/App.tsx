import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingScreen } from "@/components/auth/LoadingScreen";
import { useAuthSession } from "@/hooks/auth/useAuthSession";
import { setupSentry } from "@/utils/sentry";

// Lazy load routes
const DashboardLayout = lazy(() => import("@/layouts/DashboardLayout"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/auth/callback"));

// Cache durations and cleanup intervals
const CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
const MESSAGE_BATCH_SIZE = 10;
const MESSAGE_BATCH_INTERVAL = 2000; // 2 seconds

// Initialize Sentry as early as possible
if (import.meta.env.PROD) {
  setupSentry();
}

// Add error handling for resource loading
const handleResourceError = (e: ErrorEvent) => {
  const target = e.target as HTMLElement;
  if (target instanceof HTMLImageElement) {
    console.warn(`Image loading error: ${target.src}`);
  } else if (target instanceof HTMLScriptElement) {
    console.warn(`Script loading error: ${target.src}`);
  } else if (target instanceof HTMLLinkElement) {
    console.warn(`Link loading error: ${target.href}`);
  }
  e.preventDefault();
};

window.addEventListener('error', handleResourceError);

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

function AppRoutes() {
  const { session, loading } = useAuthSession();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route
        path="/auth/callback"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <AuthCallback />
          </Suspense>
        }
      />
      <Route
        path="/auth/*"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <Auth />
          </Suspense>
        }
      />
      <Route
        path="/*"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <DashboardLayout />
          </Suspense>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppRoutes />
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;