import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, LinkIcon, PaperclipIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CommentFormProps {
  isAdmin: boolean;
  onSubmit: (comment: string, files: File[], links: string[]) => Promise<void>;
}

export function CommentForm({ isAdmin, onSubmit }: CommentFormProps) {
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [link, setLink] = useState("");
  const [links, setLinks] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
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

    setFiles(prevFiles => [...prevFiles, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleAddLink = () => {
    if (link && !links.includes(link)) {
      setLinks([...links, link]);
      setLink("");
    }
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    
    setIsUploading(true);
    try {
      await onSubmit(comment, files, links);
      setComment("");
      setFiles([]);
      setLinks([]);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-4 mt-4">
      <Textarea
        placeholder="Rašyti komentarą..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
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
          <div className="flex gap-2 flex-1">
            <input
              type="url"
              placeholder="Įvesti nuorodą..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="flex-1 px-3 py-2 bg-secondary rounded-md"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddLink}
              disabled={!link}
            >
              <LinkIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {(files.length > 0 || links.length > 0) && (
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
              {links.map((link, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-secondary/50 p-2 rounded"
                >
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline truncate"
                    >
                      {link}
                    </a>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLink(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!comment || isUploading}
        className="w-full"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Įkeliama...
          </>
        ) : (
          "Pridėti komentarą"
        )}
      </Button>
    </div>
  );
}