import { House, CheckSquare, Inbox, CheckCircle, BarChart2, Users } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { GradientText } from "@/components/ui/gradient-text";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function DashboardSidebar() {
  const location = useLocation();
  const { toast } = useToast();
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(mediaQuery.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const handleThemeChange = (value: string) => {
    setTheme(value);
    toast({
      title: value === 'system' 
        ? "Sistemos tema įjungta" 
        : value === 'dark' 
          ? "Tamsi tema įjungta" 
          : "Šviesi tema įjungta",
      duration: 1500
    });
  };

  const menuItems = [
    { icon: House, label: "Pradžia", path: "/" },
    { icon: CheckSquare, label: "Mano užduotys", path: "/tasks" },
    { icon: Inbox, label: "Prašymai", path: "/requests" },
    { icon: CheckCircle, label: "Atliktos užduotys", path: "/completed" },
    { icon: BarChart2, label: "Statistika", path: "/statistics" },
    { icon: Users, label: "Komandos", path: "/teams" },
  ];

  return (
    <aside className="w-64 bg-card p-6 flex flex-col">
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
                      ? "bg-primary text-primary-foreground"
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
        <RadioGroup value={theme} onValueChange={handleThemeChange}>
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