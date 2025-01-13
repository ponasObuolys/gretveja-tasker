import { Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

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
  const { data: tasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*");
      
      if (error) throw error;
      return data as Tables<"tasks">[];
    },
  });

  // Calculate statistics
  const activeTasks = tasks?.filter(task => 
    task.status === "REIKIA_PADARYTI" || task.status === "VYKDOMA"
  ).length ?? 0;

  const completedTasks = tasks?.filter(task => 
    task.status === "PADARYTA"
  ).length ?? 0;

  const failedTasks = tasks?.filter(task => 
    task.status === "ATMESTA"
  ).length ?? 0;

  const successRate = completedTasks + failedTasks > 0
    ? Math.round((completedTasks / (completedTasks + failedTasks)) * 100)
    : 0;

  return (
    <div className="bg-[#242832] rounded-lg p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="text-lg font-medium">Užduočių statistika</h3>
        <Select defaultValue="30">
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Pasirinkite laikotarpį" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Paskutinės 7 dienos</SelectItem>
            <SelectItem value="30">Paskutinės 30 dienų</SelectItem>
            <SelectItem value="90">Paskutinės 90 dienų</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1A1D24] p-4 rounded-lg">
          <h4 className="text-sm text-gray-400">Aktyvios</h4>
          <p className="text-2xl font-semibold mt-1">{activeTasks}</p>
        </div>
        <div className="bg-[#1A1D24] p-4 rounded-lg">
          <h4 className="text-sm text-gray-400">Atliktos</h4>
          <p className="text-2xl font-semibold mt-1">{completedTasks}</p>
        </div>
        <div className="bg-[#1A1D24] p-4 rounded-lg">
          <h4 className="text-sm text-gray-400">Sėkmės rodiklis</h4>
          <p className="text-2xl font-semibold mt-1">{successRate}%</p>
        </div>
      </div>

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
    </div>
  );
}