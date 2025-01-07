import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen p-4">
      <div className="flex justify-end mb-4">
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </div>
      <h1 className="text-2xl font-bold mb-4">Task Track</h1>
      {/* Your existing content will go here */}
    </div>
  );
};

export default Index;