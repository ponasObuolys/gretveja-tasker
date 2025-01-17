import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PaperclipIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadSectionProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

export function FileUploadSection({ files, onFilesChange }: FileUploadSectionProps) {
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const validFiles = selectedFiles.filter(file => {
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ];
      const validSize = file.size <= 10 * 1024 * 1024; // 10MB
      return validTypes.includes(file.type) && validSize;
    });

    if (validFiles.length !== selectedFiles.length) {
      toast({
        title: "Netinkami failai",
        description: "Kai kurie failai buvo atmesti. Leidžiami tik .pdf, .doc, .docx, .xls, .xlsx failai iki 10MB.",
        variant: "destructive",
      });
    }

    onFilesChange([...files, ...validFiles]);
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => document.getElementById('fileInput')?.click()}
        className="flex-1"
      >
        <PaperclipIcon className="w-4 h-4 mr-2" />
        Prisegti failus
      </Button>
      <input
        id="fileInput"
        type="file"
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.xls,.xlsx"
        multiple
        className="hidden"
      />
      {files.length > 0 && (
        <ScrollArea className="h-[100px] rounded-md border p-2">
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-secondary/50 p-2 rounded"
              >
                <div className="flex items-center gap-2">
                  <PaperclipIcon className="w-4 h-4" />
                  <span className="text-sm truncate">{file.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </>
  );
}