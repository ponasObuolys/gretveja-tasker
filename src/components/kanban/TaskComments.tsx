import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { lt } from "date-fns/locale";
import { Tables } from "@/integrations/supabase/types";
import { PaperclipIcon, LinkIcon, Loader2 } from "lucide-react";

interface TaskComment extends Tables<"task_comments"> {
  profiles?: {
    email: string | null;
  } | null;
}

interface TaskCommentsProps {
  taskId: string;
  isAdmin: boolean;
}

export function TaskComments({ taskId, isAdmin }: TaskCommentsProps) {
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [link, setLink] = useState("");
  const [links, setLinks] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ["comments", taskId],
    queryFn: async () => {
      console.log("Fetching comments for task:", taskId);
      const { data, error } = await supabase
        .from("task_comments")
        .select(`*, profiles (email)`)
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching comments:", error);
        throw error;
      }

      console.log("Fetched comments:", data);
      return data as TaskComment[];
    },
  });

  const uploadFiles = async (commentId: string) => {
    const uploadedFiles = [];
    for (const file of files) {
      const fileExt = file.name.split(".").pop();
      const filePath = `${commentId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("comment_attachments")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Error uploading file:", uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("comment_attachments")
        .getPublicUrl(filePath);

      uploadedFiles.push({
        filename: file.name,
        url: publicUrl,
        type: file.type,
      });
    }
    return uploadedFiles;
  };

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      if (!isAdmin) {
        throw new Error("Only admins can add comments");
      }

      setIsUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("No authenticated user found");
      }

      let uploadedFiles = [];
      if (files.length > 0) {
        const { data } = await supabase
          .from("task_comments")
          .insert({
            task_id: taskId,
            user_id: user.id,
            comment,
            links,
          })
          .select()
          .single();

        if (data) {
          uploadedFiles = await uploadFiles(data.id);
        }
      }

      const { error } = await supabase
        .from("task_comments")
        .insert({
          task_id: taskId,
          user_id: user.id,
          comment,
          attachments: uploadedFiles,
          links,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      setComment("");
      setFiles([]);
      setLinks([]);
      setLink("");
      toast({
        title: "Komentaras pridėtas",
        description: "Komentaras sėkmingai pridėtas",
      });
    },
    onError: (error) => {
      console.error("Error adding comment:", error);
      toast({
        title: "Klaida",
        description: error instanceof Error ? error.message : "Nepavyko pridėti komentaro",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const handleAddLink = () => {
    if (link && !links.includes(link)) {
      setLinks([...links, link]);
      setLink("");
    }
  };

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

  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-4 mt-4">
      {isAdmin && (
        <div className="space-y-4">
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
            onClick={() => addCommentMutation.mutate()}
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
      )}

      <div className="space-y-4">
        {comments?.map((comment) => (
          <div key={comment.id} className="bg-secondary/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div className="font-medium">{comment.profiles?.email || "Nežinomas vartotojas"}</div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(comment.created_at), "PPP", { locale: lt })}
              </div>
            </div>
            <p className="text-sm">{comment.comment}</p>
            {comment.attachments && (comment.attachments as any[]).length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {(comment.attachments as any[]).map((file, index) => (
                  <a
                    key={index}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-blue-500 hover:underline"
                  >
                    <PaperclipIcon className="w-4 h-4" />
                    {file.filename}
                  </a>
                ))}
              </div>
            )}
            {comment.links && comment.links.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {comment.links.map((link, index) => (
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-blue-500 hover:underline"
                  >
                    <LinkIcon className="w-4 h-4" />
                    {link}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}