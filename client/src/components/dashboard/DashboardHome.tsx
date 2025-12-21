import { User } from "@supabase/supabase-js";
import { ArrowUpRight, ArrowDownLeft, TrendingUp, Wallet, CreditCard, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface DashboardHomeProps {
  user: User;
}

const DashboardHome = ({ user }: DashboardHomeProps) => {
  const firstName = user.user_metadata?.full_name?.split(" ")[0] || "there";

  // Mock data for demonstration
  const accounts = [
    { name: "Main Account", balance: 24580.50, type: "Checking", change: "+2.5%" },
    { name: "Savings", balance: 12340.00, type: "Savings", change: "+5.2%" },
  ];

  const recentTransactions = [
    { id: 1, name: "Netflix Subscription", amount: -15.99, date: "Today", type: "expense" },
    { id: 2, name: "Salary Deposit", amount: 5200.00, date: "Dec 15", type: "income" },
    { id: 3, name: "Amazon Purchase", amount: -89.99, date: "Dec 14", type: "expense" },
    { id: 4, name: "Transfer from John", amount: 250.00, date: "Dec 13", type: "income" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">
          Good morning, <span className="gradient-text">{firstName}</span>! 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's what's happening with your money.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link to="/dashboard/transfer">
          <Button variant="glass" className="w-full h-auto py-4 flex-col gap-2">
            <Send className="w-5 h-5 text-primary" />
            <span className="text-xs">Send</span>
          </Button>
        </Link>
        <Link to="/dashboard/accounts">
          <Button variant="glass" className="w-full h-auto py-4 flex-col gap-2">
            <ArrowDownLeft className="w-5 h-5 text-success" />
            <span className="text-xs">Receive</span>
          </Button>
        </Link>
        <Link to="/dashboard/cards">
          <Button variant="glass" className="w-full h-auto py-4 flex-col gap-2">
            <CreditCard className="w-5 h-5 text-accent" />
            <span className="text-xs">Cards</span>
          </Button>
        </Link>
      </div>

      {/* Account Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {accounts.map((account, index) => (
          <div
            key={account.name}
            className={`glass-card p-6 ${index === 0 ? 'gradient-bg' : ''}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className={`text-sm ${index === 0 ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  {account.type}
                </p>
                <p className={`font-semibold ${index === 0 ? 'text-primary-foreground' : 'text-foreground'}`}>
                  {account.name}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${index === 0 ? 'bg-white/20' : 'bg-primary/10'}`}>
                <Wallet className={`w-5 h-5 ${index === 0 ? 'text-primary-foreground' : 'text-primary'}`} />
              </div>
            </div>
            <div className="space-y-2">
              <p className={`text-3xl font-bold ${index === 0 ? 'text-primary-foreground' : 'text-foreground'}`}>
                ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <div className={`inline-flex items-center gap-1 text-sm ${index === 0 ? 'text-primary-foreground/80' : 'text-success'}`}>
                <TrendingUp className="w-4 h-4" />
                {account.change} this month
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
          <Link to="/dashboard/transactions">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>
        <div className="space-y-3">
          {recentTransactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  {tx.type === 'income' ? (
                    <ArrowDownLeft className="w-5 h-5 text-success" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-destructive" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{tx.name}</p>
                  <p className="text-sm text-muted-foreground">{tx.date}</p>
                </div>
              </div>
              <p className={`font-semibold ${tx.type === 'income' ? 'text-success' : 'text-foreground'}`}>
                {tx.type === 'income' ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
