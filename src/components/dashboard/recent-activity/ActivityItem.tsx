import { ActivityType } from "./types";
import { ActivityIcon } from "./ActivityIcon";
import { ActivityMessage } from "./ActivityMessage";

export function ActivityItem({ activity }: { activity: ActivityType }) {
  return (
    <div className="flex items-start space-x-3 text-sm">
      <ActivityIcon activity={activity} />
      <div>
        <ActivityMessage activity={activity} />
        <p className="text-gray-500 text-xs mt-1">
          {activity.date.toLocaleString('lt-LT', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })}
        </p>
      </div>
    </div>
  );
}