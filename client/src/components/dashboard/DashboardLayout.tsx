import { useState } from "react";
import { User } from "@supabase/supabase-js";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import BottomNav from "./BottomNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
}

const DashboardLayout = ({ children, user }: DashboardLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Desktop Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <TopNav user={user} onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-8 overflow-auto">
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <BottomNav />
      </div>
    </div>
  );
};

export default DashboardLayout;
