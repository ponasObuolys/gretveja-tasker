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
      retry: (failureCount, error) => {
        // Don't retry on 404s or auth errors
        if (error instanceof Error && error.message.includes('Auth')) {
          return false;
        }
        // Retry up to 3 times with exponential backoff
        return failureCount < 3;
      },
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
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error getting initial session:", sessionError);
          // Show network error toast if it's a network issue
          if (sessionError.message === "Failed to fetch") {
            toast({
              title: "Tinklo klaida",
              description: "Nepavyko prisijungti prie serverio. Patikrinkite interneto ryšį.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Prisijungimo klaida",
              description: "Nepavyko gauti sesijos. Bandykite dar kartą.",
              variant: "destructive",
            });
          }
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
          toast({
            title: "Sesijos klaida",
            description: "Nepavyko atnaujinti sesijos. Prašome prisijungti iš naujo.",
            variant: "destructive",
          });
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

    // Initialize auth on mount with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    const retryAuth = async () => {
      try {
        await initializeAuth();
      } catch (error) {
        console.error(`Auth initialization attempt ${retryCount + 1} failed:`, error);
        if (retryCount < maxRetries) {
          retryCount++;
          const delay = Math.min(1000 * 2 ** retryCount, 30000);
          setTimeout(retryAuth, delay);
        } else {
          console.error("Max retries reached for auth initialization");
          toast({
            title: "Prisijungimo klaida",
            description: "Nepavyko prisijungti po kelių bandymų. Perkraukite puslapį.",
            variant: "destructive",
          });
        }
      }
    };

    retryAuth();

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