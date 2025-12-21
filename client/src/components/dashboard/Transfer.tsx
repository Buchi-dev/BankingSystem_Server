import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, User, DollarSign, FileText, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Transfer = () => {
  const { toast } = useToast();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate transfer
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: "Transfer Successful!",
      description: `$${amount} has been sent to ${recipient}.`,
    });

    setRecipient("");
    setAmount("");
    setNote("");
    setLoading(false);
  };

  const quickAmounts = [50, 100, 250, 500];

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Transfer Money</h1>
        <p className="text-muted-foreground mt-1">Send money to anyone, instantly</p>
      </div>

      {/* Transfer Form */}
      <div className="glass-card p-6">
        <form onSubmit={handleTransfer} className="space-y-6">
          {/* Recipient */}
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient</Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="recipient"
                placeholder="Email or phone number"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="pl-12"
                required
              />
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-12 text-2xl font-bold h-16"
                required
                min="0.01"
                step="0.01"
              />
            </div>
            {/* Quick Amounts */}
            <div className="flex gap-2 mt-3">
              {quickAmounts.map((amt) => (
                <Button
                  key={amt}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(amt.toString())}
                >
                  ${amt}
                </Button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
              <Input
                id="note"
                placeholder="What's this for?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="pl-12"
              />
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" variant="hero" size="xl" className="w-full group" disabled={loading}>
            {loading ? (
              "Processing..."
            ) : (
              <>
                Send Money
                <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Recent Recipients */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4">Recent Recipients</h3>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {["John D.", "Sarah M.", "Alex K.", "Emma R."].map((name) => (
            <button
              key={name}
              onClick={() => setRecipient(name)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors"
            >
              <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center text-primary-foreground font-semibold">
                {name.slice(0, 2)}
              </div>
              <span className="text-sm text-muted-foreground whitespace-nowrap">{name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Transfer;
