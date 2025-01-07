import { BarChart2, Bell, CheckCircle, CheckSquare, Inbox, Settings, Users } from "lucide-react";
import { KanbanBoard } from "../kanban/KanbanBoard";
import { ThemeToggle } from "./ThemeToggle";
import { UserProfile } from "./UserProfile";
import { RecentActivity } from "./RecentActivity";
import { TasksGraph } from "./TasksGraph";

export const DashboardLayout = () => {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold">GRETVĖJA TASKER</h1>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground">
                <BarChart2 className="h-5 w-5" />
                <span>Dashboard</span>
              </button>
            </li>
            <li>
              <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-secondary">
                <CheckSquare className="h-5 w-5" />
                <span>My Tasks</span>
              </button>
            </li>
            <li>
              <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-secondary">
                <Inbox className="h-5 w-5" />
                <span>Requests</span>
              </button>
            </li>
            <li>
              <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-secondary">
                <CheckCircle className="h-5 w-5" />
                <span>Completed</span>
              </button>
            </li>
            <li>
              <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-secondary">
                <BarChart2 className="h-5 w-5" />
                <span>Statistics</span>
              </button>
            </li>
            <li>
              <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-secondary">
                <Users className="h-5 w-5" />
                <span>Teams</span>
              </button>
            </li>
          </ul>
        </nav>
        
        <div className="p-4 border-t border-border">
          <ThemeToggle />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 border-b border-border flex items-center justify-between px-6">
          <div className="relative w-96">
            <input
              type="text"
              placeholder="Search for Tasks..."
              className="w-full bg-card border-border rounded-lg px-4 py-2 pl-10"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              🔍
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-secondary rounded-lg">
              <Settings className="h-5 w-5" />
            </button>
            <button className="p-2 hover:bg-secondary rounded-lg">
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 flex">
          <div className="flex-1 p-6">
            <TasksGraph />
            <div className="mt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-6">
                  <button className="text-primary border-b-2 border-primary pb-2">
                    Active Tasks
                  </button>
                  <button className="text-muted-foreground pb-2">Recent</button>
                  <button className="text-muted-foreground pb-2">Priority</button>
                </div>
                <button className="text-primary">View All</button>
              </div>
              <KanbanBoard />
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="w-80 border-l border-border p-6">
            <UserProfile />
            <RecentActivity />
          </aside>
        </div>
      </main>
    </div>
  );
};