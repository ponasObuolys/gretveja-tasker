import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";

export const ThemeToggle = () => {
  const { setTheme, theme } = useTheme();

  return (
    <RadioGroup
      defaultValue={theme}
      onValueChange={(value) => setTheme(value)}
      className="space-y-2"
    >
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="light" id="light" />
        <Label htmlFor="light">Light</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="dark" id="dark" />
        <Label htmlFor="dark">Dark</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="system" id="system" />
        <Label htmlFor="system">System Default</Label>
      </div>
    </RadioGroup>
  );
};