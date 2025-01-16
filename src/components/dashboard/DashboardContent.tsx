import { Outlet } from "react-router-dom";

export function DashboardContent() {
  return (
    <div className="flex-1">
      <Outlet />
    </div>
  );
}