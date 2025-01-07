import { useState } from "react";
import { KanbanBoard } from "../kanban/KanbanBoard";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { TasksOverview } from "./TasksOverview";
import { UserProfile } from "./UserProfile";
import { RecentActivity } from "./RecentActivity";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function DashboardLayout() {
  const [activeTab, setActiveTab] = useState("active");

  return (
    <div className="flex h-screen bg-[#1A1D24] text-white">
      <DashboardSidebar />
      
      <main className="flex-1 overflow-auto p-6">
        <DashboardHeader />
        
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Užduočių apžvalga</h2>
          <TasksOverview />
        </div>

        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <Tabs defaultValue="active" className="w-full" onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="active">Aktyvios užduotys</TabsTrigger>
                <TabsTrigger value="recent">Naujausios</TabsTrigger>
                <TabsTrigger value="priority">Prioritetinės</TabsTrigger>
              </TabsList>
              <button className="text-[#FF4B6E] hover:underline ml-4">
                Rodyti visas
              </button>
            </Tabs>
          </div>
          
          {activeTab === "active" && <KanbanBoard />}
          {/* Other tabs content will be implemented later */}
        </div>
      </main>

      <aside className="w-80 bg-[#242832] p-6 border-l border-gray-800">
        <UserProfile />
        <RecentActivity />
      </aside>
    </div>
  );
}