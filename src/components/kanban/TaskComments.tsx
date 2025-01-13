import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { CommentForm } from "./CommentForm";
import { CommentList } from "./CommentList";
import type { TaskComment } from "./types";

interface TaskCommentsProps {
  taskId: string;
  isAdmin: boolean;
}

const formatCommentData = (rawComment: any): TaskComment => ({
  id: rawComment.id,
  task_id: rawComment.task_id,
  user_id: rawComment.user_id,
  comment: rawComment.comment,
  created_at: rawComment.created_at,
  attachments: rawComment.attachments,
  links: rawComment.links || [],
  user: rawComment.task_comments_profiles
});

export function TaskComments({ taskId, isAdmin }: TaskCommentsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    const newChannel = supabase
      .channel('task_comments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`
        },
        (payload) => {
          console.log('New comment received:', payload);
          queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
        }
      )
      .subscribe();

    setChannel(newChannel);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [taskId, queryClient]);

  const { data: comments, isLoading } = useQuery({
    queryKey: ["comments", taskId],
    queryFn: async () => {
      console.log("Fetching comments for task:", taskId);
      const { data, error } = await supabase
        .from("task_comments")
        .select(`
          *,
          task_comments_profiles:user_id (
            email,
            id
          )
        `)
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching comments:", error);
        throw error;
      }

      console.log("Fetched comments:", data);
      return data?.map(formatCommentData) || [];
    },
  });

  const handleAddComment = async (comment: string, files: File[], links: string[]) => {
    if (!isAdmin) {
      toast({
        title: "Negalima pridėti komentaro",
        description: "Tik administratoriai gali pridėti komentarus",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found");

      const { error } = await supabase
        .from("task_comments")
        .insert({
          task_id: taskId,
          user_id: user.id,
          comment,
          attachments: [],
          links,
        });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      toast({
        title: "Komentaras pridėtas",
        description: "Komentaras sėkmingai pridėtas",
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko pridėti komentaro",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <CommentForm isAdmin={isAdmin} onSubmit={handleAddComment} />
      {comments && <CommentList comments={comments} />}
    </div>
  );
}