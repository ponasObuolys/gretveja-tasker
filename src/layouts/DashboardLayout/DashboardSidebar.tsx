import { House, CheckSquare, Inbox, CheckCircle, BarChart2, Users } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { GradientText } from "@/components/ui/gradient-text";

export function DashboardSidebar() {
  const location = useLocation();

  const menuItems = [
    { icon: House, label: "Pradžia", path: "/" },
    { icon: CheckSquare, label: "Mano užduotys", path: "/tasks" },
    { icon: Inbox, label: "Prašymai", path: "/requests" },
    { icon: CheckCircle, label: "Atliktos užduotys", path: "/completed" },
    { icon: BarChart2, label: "Statistika", path: "/statistics" },
    { icon: Users, label: "Komandos", path: "/teams" },
  ];

  return (
    <aside className="w-64 bg-[#242832] p-6 flex flex-col">
      <GradientText
        colors={["#FF4B6E", "#FF8F6E", "#FF4B6E"]}
        className="text-xl font-bold mb-8"
        animationSpeed={6}
      >
        GRETVĖJA TASKER
      </GradientText>

      <nav className="flex-1">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `w-full flex items-center px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-[#FF4B6E] text-white"
                      : "hover:bg-gray-700"
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto pt-6 border-t border-gray-700">
        <div className="text-sm font-medium mb-2">Tema</div>
        <RadioGroup defaultValue="dark">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="light" id="light" />
            <Label htmlFor="light">Šviesus</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="dark" id="dark" />
            <Label htmlFor="dark">Tamsus</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="system" id="system" />
            <Label htmlFor="system">Sistemos</Label>
          </div>
        </RadioGroup>
      </div>
    </aside>
  );
}

export default DashboardSidebar;