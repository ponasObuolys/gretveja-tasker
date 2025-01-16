import { Button } from "@/components/ui/button";
import { FileText, X } from "lucide-react";

interface TaskAttachmentsProps {
  isAdmin: boolean;
  isUploading: boolean;
  attachments?: {
    id: string;
    file_name: string;
    file_url: string;
  }[];
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteFile: (attachmentId: string) => void;
}

export function TaskAttachments({
  isAdmin,
  isUploading,
  attachments,
  onFileChange,
  onDeleteFile
}: TaskAttachmentsProps) {
  if (!isAdmin) return null;

  return (
    <div className="attachment-section">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="relative"
          disabled={isUploading}
        >
          <input
            type="file"
            multiple
            onChange={onFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
            accept="*/*"
          />
          <FileText className="h-4 w-4 mr-2" />
          {isUploading ? "Įkeliama..." : "Prisegti failus"}
        </Button>
      </div>
      
      <div className="attached-files">
        {attachments?.map((attachment) => (
          <div key={attachment.id} className="file-item">
            <span className="text-sm truncate block">{attachment.file_name}</span>
            {isAdmin && (
              <Button
                variant="destructive"
                size="icon"
                className="delete-file"
                onClick={() => onDeleteFile(attachment.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}