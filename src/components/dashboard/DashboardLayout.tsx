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
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export type TaskFilter = "all" | "recent" | "priority";

export function DashboardLayout() {
  const [activeTab, setActiveTab] = useState<TaskFilter>("all");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const { toast } = useToast();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (error) throw error;
      return data as Tables<"profiles">;
    },
  });

  const isAdmin = profile?.role === "ADMIN";

  const handleDeleteSelected = async () => {
    if (!isAdmin || selectedTasks.length === 0) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .in("id", selectedTasks);

      if (error) throw error;

      toast({
        title: "Užduotys ištrintos",
        description: `Sėkmingai ištrinta ${selectedTasks.length} užduočių`,
      });

      setSelectedTasks([]);
      setIsSelectionMode(false);
    } catch (error) {
      console.error("Error deleting tasks:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko ištrinti užduočių",
        variant: "destructive",
      });
    }
  };

  const handleTaskSelect = (taskId: string) => {
    setSelectedTasks(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      } else {
        return [...prev, taskId];
      }
    });
  };

  return (
    <div className="flex min-h-screen bg-[#1A1D24] text-white">
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
      <div className="hidden lg:block w-64 min-w-64 border-r border-gray-800 max-h-screen">
        <DashboardSidebar />
      </div>
      
      <div className="flex-1 flex flex-col min-h-screen">
        <DashboardHeader />
        
        <div className="p-4 lg:p-6">
          <h2 className="text-xl lg:text-2xl font-semibold mb-6">Užduočių apžvalga</h2>
          
          <div className="hidden md:block mb-8">
            <TasksOverview />
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-wrap gap-2 items-center">
              <CreateTaskDialog />
              {isAdmin && (
                <>
                  <Button
                    variant={isSelectionMode ? "secondary" : "outline"}
                    onClick={() => {
                      setIsSelectionMode(!isSelectionMode);
                      if (isSelectionMode) {
                        setSelectedTasks([]);
                      }
                    }}
                  >
                    {isSelectionMode ? "Atšaukti žymėjimą" : "Pažymėti"}
                  </Button>
                  {isSelectionMode && (
                    <Button
                      variant="destructive"
                      onClick={handleDeleteSelected}
                      disabled={selectedTasks.length === 0}
                    >
                      Ištrinti ({selectedTasks.length})
                    </Button>
                  )}
                </>
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
        </div>

        <div className="flex-1 w-full px-4">
          <KanbanBoard 
            filter={activeTab} 
            isSelectionMode={isSelectionMode}
            selectedTasks={selectedTasks}
            onTaskSelect={handleTaskSelect}
          />
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="hidden xl:block w-80 min-w-80 bg-[#242832] border-l border-gray-800 max-h-screen overflow-y-auto">
        <div className="p-6">
          <UserProfile />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}