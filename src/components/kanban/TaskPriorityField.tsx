import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";

export const TaskPriorityField = () => {
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name="priority"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => field.onChange(1)}
                className={cn(
                  "p-4 rounded-lg transition-all duration-200",
                  "border-2 hover:scale-105",
                  field.value === 1
                    ? "border-blue-500 shadow-lg"
                    : "border-transparent",
                  "bg-[#E6F3FF] text-[#000000]"
                )}
              >
                <span className="font-medium">Užduotis</span>
              </button>
              
              <button
                type="button"
                onClick={() => field.onChange(3)}
                className={cn(
                  "p-4 rounded-lg transition-all duration-200",
                  "border-2 hover:scale-105",
                  field.value === 3
                    ? "border-white shadow-lg"
                    : "border-transparent",
                  "bg-[#FF0000] text-[#FFFFFF]"
                )}
              >
                <span className="font-medium">SVARBI UŽDUOTIS</span>
              </button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};