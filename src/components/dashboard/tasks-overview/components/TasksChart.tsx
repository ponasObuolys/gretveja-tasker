import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartDataPoint } from "../types";
import { memo } from "react";

interface TasksChartProps {
  data: ChartDataPoint[];
  isLoading?: boolean;
}

interface CustomXAxisProps {
  dataKey?: string;
  stroke?: string;
  fontSize?: number;
  tickMargin?: number;
  height?: number;
  tickFormatter?: (value: string) => string;
  className?: string;
}

interface CustomYAxisProps {
  stroke?: string;
  fontSize?: number;
  tickMargin?: number;
  width?: number;
  allowDecimals?: boolean;
  className?: string;
}

const CustomXAxis = memo(({
  dataKey = "date",
  stroke = "currentColor",
  fontSize = 12,
  tickMargin = 10,
  height = 50,
  tickFormatter = (value: string) => value,
  className = "text-muted-foreground"
}: CustomXAxisProps) => (
  <XAxis
    dataKey={dataKey}
    stroke={stroke}
    fontSize={fontSize}
    tickMargin={tickMargin}
    height={height}
    tickFormatter={tickFormatter}
    className={className}
  />
));

const CustomYAxis = memo(({
  stroke = "currentColor",
  fontSize = 12,
  tickMargin = 10,
  width = 40,
  allowDecimals = false,
  className = "text-muted-foreground"
}: CustomYAxisProps) => (
  <YAxis
    stroke={stroke}
    fontSize={fontSize}
    tickMargin={tickMargin}
    width={width}
    allowDecimals={allowDecimals}
    className={className}
  />
));

CustomXAxis.displayName = "CustomXAxis";
CustomYAxis.displayName = "CustomYAxis";

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
    <div className="w-full h-[300px] min-w-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CustomXAxis />
          <CustomYAxis />
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