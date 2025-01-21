import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PeriodSelectorProps } from "../types";

export const PeriodSelector = ({ selectedPeriod, onPeriodChange }: PeriodSelectorProps) => (
  <Select 
    value={selectedPeriod}
    onValueChange={onPeriodChange}
  >
    <SelectTrigger className="w-full sm:w-[180px]">
      <SelectValue placeholder="Pasirinkite laikotarpį" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="7">Paskutinės 7 dienos</SelectItem>
      <SelectItem value="30">Paskutinės 30 dienų</SelectItem>
      <SelectItem value="90">Paskutinės 90 dienų</SelectItem>
    </SelectContent>
  </Select>
);