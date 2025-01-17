import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "./comment-form/SubmitButton";

interface CommentFormProps {
  isAdmin: boolean;
  onSubmit: (comment: string, files: File[], links: string[]) => Promise<void>;
}

export function CommentForm({ isAdmin, onSubmit }: CommentFormProps) {
  const [comment, setComment] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    
    setIsUploading(true);
    try {
      await onSubmit(comment, [], []);
      setComment("");
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
      <SubmitButton
        isUploading={isUploading}
        disabled={!comment}
        onClick={handleSubmit}
      />
    </div>
  );
}