import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Wallet, 
  List, 
  Send, 
  CreditCard, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  Landmark
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Wallet, label: "Accounts", path: "/dashboard/accounts" },
  { icon: List, label: "Transactions", path: "/dashboard/transactions" },
  { icon: Send, label: "Transfer Money", path: "/dashboard/transfer" },
  { icon: CreditCard, label: "Cards", path: "/dashboard/cards" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0">
            <Landmark className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && <span className="text-lg font-bold">NexBank</span>}
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", collapsed && "mx-auto")} />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
