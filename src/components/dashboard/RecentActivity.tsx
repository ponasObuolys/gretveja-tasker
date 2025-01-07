import { CheckCircle } from "lucide-react";

export const RecentActivity = () => {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <button className="text-primary text-sm">View All</button>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <CheckCircle className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Task Completed</p>
            <p className="text-xs text-muted-foreground">Website Redesign</p>
            <p className="text-xs text-muted-foreground">2 hours ago</p>
          </div>
        </div>
      </div>
    </div>
  );
};