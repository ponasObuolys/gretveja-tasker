import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { FileUploadSection } from "./comment-form/FileUploadSection";
import { LinkInputSection } from "./comment-form/LinkInputSection";
import { SubmitButton } from "./comment-form/SubmitButton";

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
          <FileUploadSection
            files={files}
            onFilesChange={setFiles}
          />
          <LinkInputSection
            link={link}
            links={links}
            onLinkChange={setLink}
            onLinksChange={setLinks}
          />
        </div>
      </div>

      <SubmitButton
        isUploading={isUploading}
        disabled={!comment}
      />
    </div>
  );
}