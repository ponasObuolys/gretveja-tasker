import { useState } from "react";
import { KanbanBoard } from "../kanban/KanbanBoard";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { TasksOverview } from "./TasksOverview";
import { UserProfile } from "./UserProfile";
import { RecentActivity } from "./RecentActivity";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function DashboardLayout() {
  const [activeTab, setActiveTab] = useState("active");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#1A1D24] text-white">
      {/* Mobile Menu */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild className="lg:hidden absolute top-4 left-4 z-50">
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[80%] sm:w-[350px] bg-[#242832] p-0">
          <DashboardSidebar />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <DashboardSidebar />
      </div>
      
      <main className="flex-1 min-h-screen w-full overflow-x-hidden">
        <DashboardHeader />
        
        <div className="p-4 lg:p-6 space-y-6">
          <h2 className="text-xl lg:text-2xl font-semibold">Užduočių apžvalga</h2>
          
          <div className="hidden md:block">
            <TasksOverview />
          </div>

          <div className="mt-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <Tabs 
                defaultValue="active" 
                className="w-full sm:w-auto" 
                onValueChange={setActiveTab}
              >
                <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
                  <TabsTrigger value="active">Aktyvios</TabsTrigger>
                  <TabsTrigger value="recent">Naujausios</TabsTrigger>
                  <TabsTrigger value="priority">Prioritetinės</TabsTrigger>
                </TabsList>
              </Tabs>
              <button className="text-[#FF4B6E] hover:underline w-full sm:w-auto text-center">
                Rodyti visas
              </button>
            </div>
            
            {activeTab === "active" && <KanbanBoard />}
            {/* Other tabs content will be implemented later */}
          </div>
        </div>
      </main>

      <aside className="hidden xl:block w-80 bg-[#242832] p-6 border-l border-gray-800 overflow-y-auto">
        <UserProfile />
        <RecentActivity />
      </aside>
    </div>
  );
}
