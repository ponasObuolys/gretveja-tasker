import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HandleBarProps } from "./types";

export function HandleBar({ isOpen, onToggle, position }: HandleBarProps) {
  const isLeft = position === 'left';
  
  return (
    <>
      <button
        onClick={onToggle}
        className={`fixed ${position}-0 top-1/2 -translate-y-1/2 w-6 h-[72px] bg-background/80 backdrop-blur-sm hover:bg-background/90 transition-all duration-300 rounded-${isLeft ? 'r' : 'l'}-lg shadow-lg hover:shadow-xl flex items-center justify-center z-50 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        {isLeft ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
      
      <Button
        variant="ghost"
        size="icon"
        className={`absolute ${isLeft ? '-right-4' : '-left-4'} top-1/2 transform -translate-y-1/2 z-50 bg-background/50 backdrop-blur-sm hidden ${isLeft ? 'lg:flex' : 'xl:flex'}`}
        onClick={onToggle}
      >
        {isOpen ? 
          (isLeft ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) :
          (isLeft ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />)
        }
      </Button>
    </>
  );
}