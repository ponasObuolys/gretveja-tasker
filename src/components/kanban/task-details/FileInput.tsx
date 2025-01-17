import { Button } from "@/components/ui/button";
import { PaperclipIcon, Loader2 } from "lucide-react";

interface FileInputProps {
  isUploading: boolean;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FileInput = ({ isUploading, onFileChange }: FileInputProps) => {
  return (
    <Button
      variant="outline"
      className="relative flex-1"
      disabled={isUploading}
      onClick={(e) => e.preventDefault()}
    >
      <input
        type="file"
        multiple
        onChange={onFileChange}
        className="absolute inset-0 opacity-0 cursor-pointer"
        accept=".pdf,.doc,.docx,.xls,.xlsx"
        onClick={(e) => e.stopPropagation()}
      />
      {isUploading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <PaperclipIcon className="h-4 w-4 mr-2" />
      )}
      {isUploading ? "Įkeliama..." : "Prisegti failus"}
    </Button>
  );
};