import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Tables } from "@/integrations/supabase/types";

const COLORS = ["#FF4B6E", "#4CAF50", "#FFA726", "#9C27B0"];

interface StatusPieChartProps {
  data: Tables<"tasks">[] | undefined;
}

export const StatusPieChart = ({ data }: StatusPieChartProps) => {
  const chartData = [
    { name: "Naujos", value: data?.filter(task => task.status === "NAUJOS").length || 0 },
    { name: "Vykdomos", value: data?.filter(task => task.status === "VYKDOMOS").length || 0 },
    { name: "Įvykdytos", value: data?.filter(task => task.status === "IVYKDYTOS").length || 0 },
    { name: "Atmestos", value: data?.filter(task => task.status === "ATMESTOS").length || 0 },
  ];

  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#242832',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value: number, name: string) => [`${value} užduotys`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};