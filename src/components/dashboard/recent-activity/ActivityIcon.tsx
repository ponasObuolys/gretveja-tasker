import { CheckCircle, Clock, AlertCircle, ArrowRight, Calendar, Ban, FileText, Link2, MessageSquare } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { ActivityType } from "./types";

export function ActivityIcon({ activity }: { activity: ActivityType }) {
  const Icon = getActivityIcon(activity);
  return <Icon className="w-5 h-5 text-gray-400 mt-0.5" />;
}

function getActivityIcon(activity: ActivityType) {
  switch (activity.type) {
    case 'task':
      return getStatusIcon(activity.data.status);
    case 'comment':
      return MessageSquare;
    case 'attachment':
      return FileText;
    case 'link':
      return Link2;
    default:
      return Clock;
  }
}

function getStatusIcon(status: Tables<"tasks">["status"]) {
  switch (status) {
    case "IVYKDYTOS":
      return CheckCircle;
    case "ATMESTOS":
      return AlertCircle;
    case "VYKDOMOS":
      return ArrowRight;
    case "NUKELTOS":
      return Calendar;
    case "VELUOJANCIOS":
      return Ban;
    default:
      return Clock;
  }
}