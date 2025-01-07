import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const UserProfile = () => {
  return (
    <div className="text-center">
      <Avatar className="h-20 w-20 mx-auto">
        <AvatarImage src="/placeholder.svg" />
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
      <h2 className="mt-4 text-lg font-semibold">Aurimas Butvilauskas</h2>
      <p className="text-muted-foreground">Project Manager</p>
      
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div>
          <p className="text-2xl font-semibold">12</p>
          <p className="text-sm text-muted-foreground">Active Tasks</p>
        </div>
        <div>
          <p className="text-2xl font-semibold">48</p>
          <p className="text-sm text-muted-foreground">Completed</p>
        </div>
        <div>
          <p className="text-2xl font-semibold">92%</p>
          <p className="text-sm text-muted-foreground">Success Rate</p>
        </div>
      </div>
    </div>
  );
};