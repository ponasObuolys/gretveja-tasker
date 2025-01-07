import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { date: "Jan 1", tasks: 5 },
  { date: "Jan 5", tasks: 8 },
  { date: "Jan 10", tasks: 12 },
  { date: "Jan 15", tasks: 10 },
  { date: "Jan 20", tasks: 15 },
  { date: "Jan 25", tasks: 18 },
  { date: "Jan 30", tasks: 20 },
];

export const TasksGraph = () => {
  return (
    <div className="p-6 bg-card rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Tasks Overview</h2>
        <select className="bg-background border border-border rounded px-2 py-1 text-sm">
          <option>Last 30 Days</option>
          <option>Last 7 Days</option>
          <option>Last 90 Days</option>
        </select>
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis
              dataKey="date"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip />
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
    </div>
  );
};