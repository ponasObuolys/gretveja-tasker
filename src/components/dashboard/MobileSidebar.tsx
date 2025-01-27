import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { DashboardSidebar } from "./DashboardSidebar";
import { useEffect } from "react";

interface MobileSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ isOpen, onOpenChange }: MobileSidebarProps) {
  useEffect(() => {
    return () => {
      onOpenChange(false);
    };
  }, [onOpenChange]);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="ghost" size="icon" className="bg-background/50 backdrop-blur-sm">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[80%] sm:w-[350px] bg-[#242832] p-0 border-r border-gray-800">
        <DashboardSidebar />
      </SheetContent>
    </Sheet>
  );
}