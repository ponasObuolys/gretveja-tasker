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
      <div className="min-h-[300px] w-full min-w-[300px] flex items-center justify-center bg-background/50">
        <div className="animate-pulse text-muted-foreground">
          Kraunama...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[300px] w-full min-w-[300px] aspect-[16/9] sm:aspect-[21/9]">
      <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={300}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <XAxis 
            dataKey="date" 
            stroke="currentColor" 
            fontSize={12}
            tickMargin={10}
            height={50}
            tickFormatter={(value) => value}
            className="text-muted-foreground"
          />
          <YAxis 
            stroke="currentColor" 
            fontSize={12}
            tickMargin={10}
            width={40}
            allowDecimals={false}
            className="text-muted-foreground"
          />
          <Tooltip 
            contentStyle={{ 
              background: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--foreground)'
            }}
            formatter={(value: number) => [value, 'Užduotys']}
            labelFormatter={(label) => `Data: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="tasks"
            stroke="var(--primary)"
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