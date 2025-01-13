import { Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { format, subDays } from "date-fns";
import { lt } from "date-fns/locale";

export function TasksOverview() {
  const { data: tasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      console.log("Fetching tasks for statistics");
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching tasks:", error);
        throw error;
      }
      console.log("Fetched tasks:", data);
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

  // Generate data for the last 30 days
  const generateChartData = () => {
    const data = [];
    const today = new Date();

    // Group tasks by date
    const tasksByDate = tasks?.reduce((acc, task) => {
      const date = format(new Date(task.updated_at), 'MM-dd');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) ?? {};

    // Generate data points for the last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = subDays(today, i);
      const formattedDate = format(date, 'MM-dd');
      data.push({
        date: formattedDate,
        tasks: tasksByDate[formattedDate] || 0
      });
    }

    console.log("Generated chart data:", data);
    return data;
  };

  const chartData = generateChartData();

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
          <LineChart data={chartData}>
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
    </div>
  );
}