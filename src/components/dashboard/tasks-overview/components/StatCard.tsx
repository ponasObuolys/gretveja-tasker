import { StatCardProps } from "../types";

export const StatCard = ({ title, value }: StatCardProps) => (
  <div className="bg-[#1A1D24] p-4 rounded-lg">
    <h4 className="text-sm text-gray-400">{title}</h4>
    <p className="text-2xl font-semibold mt-1">{value}</p>
  </div>
);