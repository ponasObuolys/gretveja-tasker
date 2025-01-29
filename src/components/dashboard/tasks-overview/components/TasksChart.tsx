import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartDataPoint } from "../types";
import { memo } from "react";

interface TasksChartProps {
  data: ChartDataPoint[];
  isLoading?: boolean;
}

export const TasksChart = memo(({ data, isLoading }: TasksChartProps) => {
  if (isLoading) {
    return (
      <div className="h-[200px] sm:h-[300px] flex items-center justify-center bg-background/50">
        <div className="animate-pulse text-muted-foreground">
          Kraunama...
        </div>
      </div>
    );
  }

  return (
    <div className="h-[200px] sm:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis 
            dataKey="date" 
            stroke="#64748B" 
            fontSize={12}
            tickMargin={10}
            height={50}
            tickFormatter={(value) => value}
          />
          <YAxis 
            stroke="#64748B" 
            fontSize={12}
            tickMargin={10}
            width={40}
            allowDecimals={false}
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
            isAnimationActive={!isLoading}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

TasksChart.displayName = "TasksChart";