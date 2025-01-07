import { FormControl, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface TaskFileUploadFieldProps {
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TaskFileUploadField = ({ onFileChange }: TaskFileUploadFieldProps) => {
  return (
    <FormItem>
      <FormLabel>Prisegti failai</FormLabel>
      <FormControl>
        <Input
          type="file"
          multiple
          onChange={onFileChange}
          className="cursor-pointer"
        />
      </FormControl>
    </FormItem>
  );
};