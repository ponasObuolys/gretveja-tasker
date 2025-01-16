import { RouteObject } from "react-router-dom";
import Settings from "@/pages/Settings";
import { DashboardOverview } from "@/pages/Dashboard/Overview";

export const dashboardRoutes: RouteObject[] = [
  {
    index: true,
    element: <DashboardOverview />,
  },
  {
    path: "settings",
    element: <Settings />,
  },
];