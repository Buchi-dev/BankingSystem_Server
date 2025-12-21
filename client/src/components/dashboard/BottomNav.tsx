import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Wallet, Send, CreditCard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Home", path: "/dashboard" },
  { icon: Wallet, label: "Accounts", path: "/dashboard/accounts" },
  { icon: Send, label: "Transfer", path: "/dashboard/transfer" },
  { icon: CreditCard, label: "Cards", path: "/dashboard/cards" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "scale-110")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
