import { ArrowUpRight, ArrowDownLeft, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const transactions = [
  { id: 1, name: "Netflix Subscription", category: "Entertainment", amount: -15.99, date: "Dec 19, 2024", type: "expense" },
  { id: 2, name: "Salary Deposit", category: "Income", amount: 5200.00, date: "Dec 15, 2024", type: "income" },
  { id: 3, name: "Amazon Purchase", category: "Shopping", amount: -89.99, date: "Dec 14, 2024", type: "expense" },
  { id: 4, name: "Transfer from John", category: "Transfer", amount: 250.00, date: "Dec 13, 2024", type: "income" },
  { id: 5, name: "Grocery Store", category: "Food", amount: -156.50, date: "Dec 12, 2024", type: "expense" },
  { id: 6, name: "Uber Ride", category: "Transport", amount: -24.50, date: "Dec 11, 2024", type: "expense" },
  { id: 7, name: "Freelance Payment", category: "Income", amount: 850.00, date: "Dec 10, 2024", type: "income" },
  { id: 8, name: "Coffee Shop", category: "Food", amount: -8.50, date: "Dec 9, 2024", type: "expense" },
];

const Transactions = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTransactions = transactions.filter((tx) =>
    tx.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Transactions</h1>
        <p className="text-muted-foreground mt-1">View your transaction history</p>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Transactions List */}
      <div className="glass-card divide-y divide-border">
        {filteredTransactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                {tx.type === 'income' ? (
                  <ArrowDownLeft className="w-5 h-5 text-success" />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-destructive" />
                )}
              </div>
              <div>
                <p className="font-medium">{tx.name}</p>
                <p className="text-sm text-muted-foreground">{tx.category}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-semibold ${tx.type === 'income' ? 'text-success' : 'text-foreground'}`}>
                {tx.type === 'income' ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">{tx.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Transactions;
