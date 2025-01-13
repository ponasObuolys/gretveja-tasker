import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CommentToggleButtonProps {
  taskId: string;
  showComments: boolean;
  onToggle: (show: boolean) => void;
}

export function CommentToggleButton({ taskId, showComments, onToggle }: CommentToggleButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleComment = useMutation({
    mutationFn: async () => {
      console.log("Toggling comment for task:", taskId);
      const { data, error } = await supabase.rpc('toggle_comment', {
        task_id: taskId
      });
      if (error) {
        console.error("Error toggling comment:", error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      console.log("Comment toggled successfully");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      const newShowComments = !showComments;
      onToggle(newShowComments);
      if (newShowComments) {
        toast({
          title: "Komentarų režimas įjungtas",
          description: "Dabar galite pridėti komentarą",
        });
      }
    },
    onError: (error) => {
      console.error("Error toggling comment:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko perjungti komentarų režimo",
        variant: "destructive",
      });
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleComment.mutate();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      onClick={handleClick}
    >
      <MessageCircle className={cn(
        "h-4 w-4",
        showComments && "text-primary"
      )} />
    </Button>
  );
}