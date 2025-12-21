import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User as UserIcon, Mail, Bell, Shield, Smartphone } from "lucide-react";

interface SettingsProps {
  user: User;
}

const Settings = ({ user }: SettingsProps) => {
  const getInitials = () => {
    const name = user.user_metadata?.full_name || user.email || "";
    if (user.user_metadata?.full_name) {
      return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences</p>
      </div>

      {/* Profile Section */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-primary" />
          Profile Information
        </h3>
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-16 w-16 border-2 border-primary">
            <AvatarFallback className="gradient-bg text-primary-foreground text-xl font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{user.user_metadata?.full_name || "User"}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" defaultValue={user.user_metadata?.full_name || ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input id="email" value={user.email || ""} disabled className="pl-12" />
            </div>
          </div>
          <Button className="w-fit">Save Changes</Button>
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Notifications
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-muted-foreground">Receive notifications on your device</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Alerts</p>
              <p className="text-sm text-muted-foreground">Get email updates for transactions</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Marketing Emails</p>
              <p className="text-sm text-muted-foreground">Receive offers and promotions</p>
            </div>
            <Switch />
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Security
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
            </div>
            <Button variant="outline" size="sm">Enable</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Biometric Login</p>
              <p className="text-sm text-muted-foreground">Use fingerprint or face ID</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Change Password</p>
              <p className="text-sm text-muted-foreground">Update your account password</p>
            </div>
            <Button variant="outline" size="sm">Update</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
