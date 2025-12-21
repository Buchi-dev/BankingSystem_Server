import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, LogOut, User as UserIcon, Settings, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TopNavProps {
  user: User;
  onMenuToggle: () => void;
}

const TopNav = ({ user, onMenuToggle }: TopNavProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  const getInitials = () => {
    const name = user.user_metadata?.full_name || user.email || "";
    if (user.user_metadata?.full_name) {
      return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 bg-card/50 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 md:px-6">
      {/* Left Side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold hidden sm:block">Welcome back!</h1>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-colors">
              <Avatar className="h-9 w-9 border-2 border-primary">
                <AvatarFallback className="gradient-bg text-primary-foreground font-semibold text-sm">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">{user.user_metadata?.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
              <UserIcon className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default TopNav;
