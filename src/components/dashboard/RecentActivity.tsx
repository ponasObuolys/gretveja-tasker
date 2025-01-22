import { useActivities } from "./recent-activity/useActivities";
import { ActivityItem } from "./recent-activity/ActivityItem";

export function RecentActivity() {
  const { data: activities } = useActivities();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Paskutiniai veiksmai</h3>
        <button className="text-[#FF4B6E] text-sm hover:underline">
          Paskutinės 7 d.
        </button>
      </div>

      <div className="space-y-4">
        {activities?.map((activity, index) => (
          <ActivityItem 
            key={`${activity.type}-${index}`} 
            activity={activity} 
          />
        ))}
      </div>
    </div>
  );
}