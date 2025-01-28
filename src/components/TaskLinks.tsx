import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Link, Trash2 } from 'lucide-react';

interface TaskLink {
  id: string;
  task_id: string;
  url: string;
  created_at: string;
}

export function TaskLinks({ taskId, isAdmin }: { taskId: string; isAdmin: boolean }) {
  const [newUrl, setNewUrl] = useState('');
  const { toast } = useToast();

  const { data: links = [], refetch } = useQuery({
    queryKey: ['task-links', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_links')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TaskLink[];
    },
  });

  const addLinkMutation = useMutation({
    mutationFn: async (url: string) => {
      const { error } = await supabase
        .from('task_links')
        .insert({ task_id: taskId, url });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Nuoroda pridėta',
        description: 'Nuoroda sėkmingai pridėta prie užduoties',
      });
      setNewUrl('');
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Klaida',
        description: 'Nepavyko pridėti nuorodos',
        variant: 'destructive',
      });
      console.error('Error adding link:', error);
    },
  });

  const deleteLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from('task_links')
        .delete()
        .eq('id', linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Nuoroda ištrinta',
        description: 'Nuoroda sėkmingai ištrinta',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Klaida',
        description: 'Nepavyko ištrinti nuorodos',
        variant: 'destructive',
      });
      console.error('Error deleting link:', error);
    },
  });

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    addLinkMutation.mutate(newUrl);
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Nuorodos:</h4>
      
      {isAdmin && (
        <form onSubmit={handleAddLink} className="flex gap-2">
          <Input
            type="url"
            placeholder="Įvesti nuorodą..."
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="flex-1"
          />
          <Button 
            type="submit" 
            variant="outline"
            disabled={!newUrl || addLinkMutation.isPending}
          >
            <Link className="h-4 w-4 mr-2" />
            Pridėti
          </Button>
        </form>
      )}

      <ScrollArea className="h-[100px]">
        <div className="space-y-2">
          {links.map((link) => (
            <div key={link.id} className="flex items-center justify-between gap-2 group">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline truncate flex-1"
              >
                {link.url}
              </a>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteLinkMutation.mutate(link.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={deleteLinkMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          {links.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Nėra pridėtų nuorodų
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}