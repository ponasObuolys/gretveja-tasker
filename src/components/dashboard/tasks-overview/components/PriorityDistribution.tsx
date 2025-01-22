import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface PriorityDistributionProps {
  data: {
    low: number;
    medium: number;
    high: number;
  };
}

export const PriorityDistribution = ({ data }: PriorityDistributionProps) => {
  const chartData = [
    { name: "Žemas", value: data.low },
    { name: "Vidutinis", value: data.medium },
    { name: "Aukštas", value: data.high },
  ];

  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis 
            dataKey="name" 
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
            formatter={(value: number) => [`${value} užduotys`]}
          />
          <Bar dataKey="value" fill="#FF4B6E" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};