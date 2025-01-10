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
        <SheetTrigger asChild className="lg:hidden fixed top-4 left-4 z-50">
          <Button variant="ghost" size="icon" className="bg-background/50 backdrop-blur-sm">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[80%] sm:w-[350px] bg-[#242832] p-0 border-r border-gray-800">
          <DashboardSidebar />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 min-w-64 border-r border-gray-800">
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
                <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex gap-2">
                  <TabsTrigger value="active" className="flex-1 sm:flex-none">Aktyvios</TabsTrigger>
                  <TabsTrigger value="recent" className="flex-1 sm:flex-none">Naujausios</TabsTrigger>
                  <TabsTrigger value="priority" className="flex-1 sm:flex-none">Prioritetinės</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button 
                variant="ghost" 
                className="w-full sm:w-auto text-[#FF4B6E] hover:text-[#FF3355] hover:bg-[#242832]"
              >
                Rodyti visas
              </Button>
            </div>
            
            {activeTab === "active" && <KanbanBoard />}
            {/* Other tabs content will be implemented later */}
          </div>
        </div>
      </main>

      <aside className="hidden xl:block w-80 min-w-80 bg-[#242832] p-6 border-l border-gray-800 overflow-y-auto">
        <UserProfile />
        <RecentActivity />
      </aside>
    </div>
  );
}