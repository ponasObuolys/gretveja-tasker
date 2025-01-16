import { UserProfile } from "./UserProfile";
import { RecentActivity } from "./RecentActivity";

export function RightSidebar() {
  return (
    <div className="hidden xl:block w-80 min-w-80 bg-[#242832] border-l border-gray-800 max-h-screen overflow-y-auto">
      <div className="p-6">
        <UserProfile />
        <RecentActivity />
      </div>
    </div>
  );
}