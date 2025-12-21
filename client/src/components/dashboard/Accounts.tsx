import { Wallet, Plus, Eye, EyeOff, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const accounts = [
  {
    id: "main",
    name: "Main Checking",
    number: "****4582",
    balance: 24580.50,
    currency: "USD",
    type: "checking",
    change: "+$1,250.00",
  },
  {
    id: "savings",
    name: "High-Yield Savings",
    number: "****7891",
    balance: 12340.00,
    currency: "USD",
    type: "savings",
    change: "+$520.00",
  },
  {
    id: "investment",
    name: "Investment Account",
    number: "****2345",
    balance: 45890.75,
    currency: "USD",
    type: "investment",
    change: "+$3,200.00",
  },
];

const Accounts = () => {
  const [showBalances, setShowBalances] = useState(true);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground mt-1">Manage your bank accounts</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </div>

      {/* Total Balance Card */}
      <div className="glass-card p-6 gradient-bg">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-primary-foreground/80">Total Balance</p>
            <p className="text-4xl font-bold text-primary-foreground mt-2">
              {showBalances
                ? `$${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                : "••••••••"}
            </p>
          </div>
          <Button
            variant="glass"
            size="icon"
            onClick={() => setShowBalances(!showBalances)}
            className="bg-white/10 hover:bg-white/20"
          >
            {showBalances ? <EyeOff className="w-5 h-5 text-primary-foreground" /> : <Eye className="w-5 h-5 text-primary-foreground" />}
          </Button>
        </div>
        <div className="flex items-center gap-2 text-primary-foreground/80">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm">+$4,970.00 this month</span>
        </div>
      </div>

      {/* Account List */}
      <div className="grid gap-4">
        {accounts.map((account) => (
          <div key={account.id} className="glass-card-hover p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{account.name}</p>
                  <p className="text-sm text-muted-foreground">{account.number}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">
                  {showBalances
                    ? `$${account.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                    : "••••••"}
                </p>
                <p className="text-sm text-success">{account.change}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Accounts;
