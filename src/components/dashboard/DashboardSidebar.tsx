import { House, CheckSquare, Inbox, CheckCircle, BarChart2, Users } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { GradientText } from "@/components/ui/gradient-text";
import { useEffect, useState } from "react";

export function DashboardSidebar() {
  const location = useLocation();
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'system';
    }
    return 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      if (theme === 'system') {
        if (mediaQuery.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      } else {
        if (theme === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme();
    localStorage.setItem('theme', theme);

    const handleChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const menuItems = [
    { icon: House, label: "Pradžia", path: "/" },
    { icon: CheckSquare, label: "Mano užduotys", path: "/tasks" },
    { icon: Inbox, label: "Prašymai", path: "/requests" },
    { icon: CheckCircle, label: "Atliktos užduotys", path: "/completed" },
    { icon: BarChart2, label: "Statistika", path: "/statistics" },
    { icon: Users, label: "Komandos", path: "/teams" },
  ];

  return (
    <aside className="w-64 bg-secondary p-6 flex flex-col">
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
                      : "hover:bg-muted"
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

      <div className="mt-auto pt-6 border-t border-border">
        <div className="text-sm font-medium mb-2">Tema</div>
        <RadioGroup value={theme} onValueChange={setTheme}>
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