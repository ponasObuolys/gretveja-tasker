import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormContext, useWatch } from "react-hook-form";
import { cn } from "@/lib/utils";

export const TaskPriorityField = () => {
  const form = useFormContext();
  const priority = useWatch({
    control: form.control,
    name: "priority",
  });

  const getPriorityLabel = () => {
    const numPriority = Number(priority);
    if (numPriority >= 3 && numPriority <= 5) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-[#FF0000] text-[#FFFFFF] mb-2">
          SVARBI UŽDUOTIS
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-[#E6F3FF] text-[#000000] mb-2">
        Užduotis
      </span>
    );
  };

  return (
    <FormField
      control={form.control}
      name="priority"
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center gap-2 mb-1">
            {getPriorityLabel()}
          </div>
          <FormControl>
            <Input
              type="number"
              min={1}
              max={5}
              {...field}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || (Number(value) >= 1 && Number(value) <= 5)) {
                  field.onChange(value);
                }
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};