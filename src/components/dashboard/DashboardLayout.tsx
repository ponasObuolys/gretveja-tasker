import { useState } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { MobileSidebar } from "./MobileSidebar";
import { RightSidebar } from "./RightSidebar";
import { DashboardContent } from "./DashboardContent";
import { NotificationProvider } from "@/contexts/NotificationContext";

export type TaskFilter = "all" | "recent" | "priority";

export function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <NotificationProvider>
      <div className="flex min-h-screen bg-[#1A1D24] text-white">
        {/* Mobile Sidebar */}
        <MobileSidebar 
          isOpen={isMobileMenuOpen}
          onOpenChange={setIsMobileMenuOpen}
        />

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 min-w-64 border-r border-gray-800 max-h-screen">
          <DashboardSidebar />
        </div>
        
        <div className="flex-1 flex flex-col min-h-screen">
          <DashboardHeader />
          <DashboardContent />
        </div>

        <RightSidebar />
      </div>
    </NotificationProvider>
  );
}