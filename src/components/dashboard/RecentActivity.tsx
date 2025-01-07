import { CheckCircle, Clock, Users } from "lucide-react";

const activities = [
  {
    id: 1,
    type: "status",
    message: 'Užduotis "Sukurti dizainą" pakeista į "Padaryta"',
    icon: CheckCircle,
    timestamp: "Prieš 2 val."
  },
  {
    id: 2,
    type: "assignment",
    message: 'Aurimas priskirtas prie užduoties "Atnaujinti dokumentaciją"',
    icon: Users,
    timestamp: "Prieš 4 val."
  },
  {
    id: 3,
    type: "deadline",
    message: 'Artėja terminas: "Peržiūrėti kodą"',
    icon: Clock,
    timestamp: "Prieš 6 val."
  }
];

export function RecentActivity() {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Paskutiniai veiksmai</h3>
        <button className="text-[#FF4B6E] text-sm hover:underline">
          Rodyti viską
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start space-x-3 text-sm"
          >
            <activity.icon className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-gray-300">{activity.message}</p>
              <p className="text-gray-500 text-xs mt-1">{activity.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}