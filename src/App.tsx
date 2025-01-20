import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/auth/callback";
import { useToast } from "./hooks/use-toast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
  },
});

const AppRoutes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const initializeAuth = async () => {
      console.log("Initializing auth in AppRoutes");
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting initial session:", error);
          // Clear any stale data
          queryClient.clear();
          localStorage.removeItem('supabase.auth.token');
          await supabase.auth.signOut();
          navigate("/auth");
          return;
        }

        if (!session) {
          console.log("No initial session found");
          navigate("/auth");
          return;
        }

        // Attempt to refresh the session
        const { data: refreshResult, error: refreshError } = 
          await supabase.auth.refreshSession();
          
        if (refreshError) {
          console.error("Session refresh error:", refreshError);
          await supabase.auth.signOut();
          navigate("/auth");
          return;
        }

        console.log("Session initialized successfully:", {
          user: session.user.email,
          expiresAt: session.expires_at
        });
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Handle network errors
        toast({
          title: "Prisijungimo klaida",
          description: "Nepavyko prisijungti prie serverio. Bandykite dar kartą.",
          variant: "destructive",
        });
        navigate("/auth");
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed in AppRoutes:", event, {
        hasSession: !!session,
        user: session?.user?.email
      });

      if (event === 'SIGNED_OUT' || !session) {
        console.log("User signed out or session expired");
        // Clear any stale data
        queryClient.clear();
        localStorage.removeItem('supabase.auth.token');
        
        toast({
          title: "Sesija pasibaigė",
          description: "Prašome prisijungti iš naujo",
          variant: "destructive",
        });
        navigate("/auth");
      }
    });

    // Initialize auth on mount
    initializeAuth();

    return () => {
      console.log("Cleaning up auth subscription in AppRoutes");
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

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
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;