import { createBrowserRouter } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { dashboardRoutes } from "./dashboard";
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: dashboardRoutes,
  },
]);