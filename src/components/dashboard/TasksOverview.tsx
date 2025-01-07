import { Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const data = [
  { date: "Saus 01", tasks: 4 },
  { date: "Saus 05", tasks: 3 },
  { date: "Saus 10", tasks: 6 },
  { date: "Saus 15", tasks: 4 },
  { date: "Saus 20", tasks: 8 },
  { date: "Saus 25", tasks: 6 },
  { date: "Saus 30", tasks: 9 },
];

export function TasksOverview() {
  return (
    <div className="bg-[#242832] rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Užduočių statistika</h3>
        <Select defaultValue="30">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Pasirinkite laikotarpį" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Paskutinės 7 dienos</SelectItem>
            <SelectItem value="30">Paskutinės 30 dienų</SelectItem>
            <SelectItem value="90">Paskutinės 90 dienų</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="date" stroke="#64748B" />
            <YAxis stroke="#64748B" />
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
}