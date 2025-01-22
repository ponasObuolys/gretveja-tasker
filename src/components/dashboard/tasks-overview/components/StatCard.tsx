import { StatCardProps } from "../types";
import { TrendingDown, TrendingUp } from "lucide-react";

export const StatCard = ({ title, value, trend }: StatCardProps) => (
  <div className="bg-[#1A1D24] p-4 rounded-lg">
    <h4 className="text-sm text-gray-400">{title}</h4>
    <div className="flex items-center gap-2">
      <p className="text-2xl font-semibold mt-1">{value}</p>
      {trend !== undefined && (
        <span className={`flex items-center ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span className="text-sm ml-1">{Math.abs(trend)}%</span>
        </span>
      )}
    </div>
  </div>
);