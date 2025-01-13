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
import { CreateTaskDialog } from "../kanban/CreateTaskDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TaskFilter = "all" | "recent" | "priority";

export function DashboardLayout() {
  const [activeTab, setActiveTab] = useState<TaskFilter>("all");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showDeleteMode, setShowDeleteMode] = useState(false);

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return profile;
    },
  });

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
              <div className="flex gap-2 items-center">
                <CreateTaskDialog />
                {userProfile?.role === "ADMIN" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteMode(!showDeleteMode)}
                    className={`truncate max-w-[200px] ${showDeleteMode ? "bg-yellow-600 hover:bg-yellow-700" : ""}`}
                  >
                    Pažymėti ir ištrinti
                  </Button>
                )}
              </div>
              <Tabs 
                defaultValue="all" 
                className="w-full sm:w-auto" 
                onValueChange={(value) => setActiveTab(value as TaskFilter)}
              >
                <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex gap-2">
                  <TabsTrigger value="all" className="flex-1 sm:flex-none">Visos</TabsTrigger>
                  <TabsTrigger value="recent" className="flex-1 sm:flex-none">Naujausios</TabsTrigger>
                  <TabsTrigger value="priority" className="flex-1 sm:flex-none">Prioritetinės</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <KanbanBoard filter={activeTab} showDeleteMode={showDeleteMode} />
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