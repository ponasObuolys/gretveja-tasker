import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartDataPoint } from "../types";

interface TasksChartProps {
  data: ChartDataPoint[];
}

export const TasksChart = ({ data }: TasksChartProps) => (
  <div className="h-[200px] sm:h-[300px]">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <XAxis 
          dataKey="date" 
          stroke="#64748B" 
          fontSize={12}
          tickMargin={10}
        />
        <YAxis 
          stroke="#64748B" 
          fontSize={12}
          tickMargin={10}
        />
        <Tooltip 
          contentStyle={{ 
            background: '#242832',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#fff'
          }}
          formatter={(value: number) => [value, 'Užduotys']}
          labelFormatter={(label) => `Data: ${label}`}
        />
        <Line
          type="monotone"
          dataKey="tasks"
          stroke="#FF4B6E"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);