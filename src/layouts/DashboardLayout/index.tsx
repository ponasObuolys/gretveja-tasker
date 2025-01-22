import { lazy, Suspense } from 'react';
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { HandleBar } from "./HandleBar";
import { useDashboardLayout } from "./useDashboardLayout";
import { BottomNav } from "@/components/mobile/BottomNav";

const DashboardSidebar = lazy(() => import("./DashboardSidebar"));
const DashboardHeader = lazy(() => import("./DashboardHeader"));
const DashboardContent = lazy(() => import("./DashboardContent"));
const RightSidebar = lazy(() => import("./RightSidebar"));
const MobileSidebar = lazy(() => import("./MobileSidebar"));

export function DashboardLayout() {
  const {
    activeTab,
    isMobileMenuOpen,
    selectedTasks,
    isSelectionMode,
    leftSidebarOpen,
    rightSidebarOpen,
    setActiveTab,
    setIsMobileMenuOpen,
    setSelectedTasks,
    setIsSelectionMode,
    setLeftSidebarOpen,
    setRightSidebarOpen,
    handleTaskSelect,
    profile,
    isAdmin,
  } = useDashboardLayout();

  return (
    <NotificationProvider>
      <div className="flex min-h-screen bg-[#1A1D24] text-white">
        <Suspense fallback={<LoadingSpinner />}>
          <MobileSidebar 
            isOpen={isMobileMenuOpen}
            onOpenChange={setIsMobileMenuOpen}
          />
        </Suspense>

        {/* Left sidebar - hidden on mobile */}
        <div className={`relative transition-all duration-300 ease-in-out hidden lg:block ${leftSidebarOpen ? 'w-64 min-w-64' : 'w-0'} border-r border-gray-800 max-h-screen overflow-hidden`}>
          <HandleBar
            isOpen={leftSidebarOpen}
            onToggle={() => setLeftSidebarOpen(!leftSidebarOpen)}
            position="left"
          />
          <div className="h-full">
            <Suspense fallback={<LoadingSpinner />}>
              <DashboardSidebar />
            </Suspense>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col min-h-screen pb-16 lg:pb-0">
          <Suspense fallback={<LoadingSpinner />}>
            <DashboardHeader />
          </Suspense>
          
          <Suspense fallback={<LoadingSpinner />}>
            <DashboardContent
              isAdmin={isAdmin}
              activeTab={activeTab}
              isSelectionMode={isSelectionMode}
              selectedTasks={selectedTasks}
              setActiveTab={setActiveTab}
              setIsSelectionMode={setIsSelectionMode}
              setSelectedTasks={setSelectedTasks}
              handleTaskSelect={handleTaskSelect}
            />
          </Suspense>
        </div>

        <div className={`relative transition-all duration-300 ease-in-out hidden lg:block ${rightSidebarOpen ? 'w-80 min-w-80' : 'w-0'} border-l border-gray-800 max-h-screen overflow-hidden`}>
          <HandleBar
            isOpen={rightSidebarOpen}
            onToggle={() => setRightSidebarOpen(!rightSidebarOpen)}
            position="right"
          />
          <div className="h-full">
            <Suspense fallback={<LoadingSpinner />}>
              <RightSidebar />
            </Suspense>
          </div>
        </div>

        {/* Bottom Navigation - visible only on mobile */}
        <BottomNav />
      </div>
    </NotificationProvider>
  );
}

export default DashboardLayout;