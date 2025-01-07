import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

    setFiles(validFiles);
  };

  const handleAddLink = () => {
    if (link && !links.includes(link)) {
      setLinks([...links, link]);
      setLink("");
    }
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
      <div className="flex gap-2 flex-wrap">
        <Input
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.xls,.xlsx"
          multiple
          className="max-w-[300px]"
        />
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="Įvesti nuorodą..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="max-w-[200px]"
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
      {links.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {links.map((link, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-secondary p-2 rounded-md"
            >
              <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">
                {link}
              </a>
              <button
                onClick={() => setLinks(links.filter((_, i) => i !== index))}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
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