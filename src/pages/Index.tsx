import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";

const Index = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen">
      <div className="flex justify-between items-center p-4 border-b">
        <h1 className="text-2xl font-bold">GRETVEJA TASKER</h1>
        <Button onClick={handleLogout} variant="outline">
          Atsijungti
        </Button>
      </div>
      <KanbanBoard />
    </div>
  );
};

export default Index;