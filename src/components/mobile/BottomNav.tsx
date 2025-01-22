import { Home, ListTodo, BarChart2, Users } from "lucide-react";
import { NavLink } from "react-router-dom";

export function BottomNav() {
  const navItems = [
    { icon: Home, label: "Pradžia", path: "/" },
    { icon: ListTodo, label: "Mano užduotys", path: "/tasks" },
    { icon: BarChart2, label: "Statistika", path: "/statistics" },
    { icon: Users, label: "Komandos", path: "/teams" }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border lg:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-w-[64px] min-h-[44px] px-2 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs mt-1">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}