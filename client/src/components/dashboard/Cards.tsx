import { CreditCard, Plus, Lock, Unlock, Eye, EyeOff, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const cards = [
  {
    id: "visa",
    type: "Visa",
    number: "**** **** **** 4582",
    holder: "JOHN DOE",
    expiry: "12/26",
    balance: 24580.50,
    gradient: "from-primary to-purple-600",
    isLocked: false,
  },
  {
    id: "mastercard",
    type: "Mastercard",
    number: "**** **** **** 7891",
    holder: "JOHN DOE",
    expiry: "08/25",
    balance: 5000.00,
    gradient: "from-orange-500 to-red-500",
    isLocked: true,
  },
];

const Cards = () => {
  const [showCardNumber, setShowCardNumber] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Cards</h1>
          <p className="text-muted-foreground mt-1">Manage your debit and credit cards</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Card
        </Button>
      </div>

      {/* Cards Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {cards.map((card) => (
          <div key={card.id} className="space-y-4">
            {/* Card Design */}
            <div className={`relative aspect-[1.586/1] rounded-3xl bg-gradient-to-br ${card.gradient} p-6 shadow-2xl overflow-hidden`}>
              {/* Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-white rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white rounded-full" />
              </div>

              <div className="relative h-full flex flex-col justify-between text-primary-foreground">
                {/* Top Row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-8 h-8 rotate-90" />
                  </div>
                  <span className="text-lg font-bold">{card.type}</span>
                </div>

                {/* Card Number */}
                <div>
                  <p className="text-xs text-primary-foreground/70 mb-1">Card Number</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-mono tracking-widest">
                      {showCardNumber[card.id] ? "4582 1234 5678 4582" : card.number}
                    </p>
                    <button
                      onClick={() => setShowCardNumber((prev) => ({ ...prev, [card.id]: !prev[card.id] }))}
                      className="p-1 hover:bg-white/20 rounded transition-colors"
                    >
                      {showCardNumber[card.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-primary-foreground/70">Card Holder</p>
                    <p className="font-semibold">{card.holder}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-primary-foreground/70">Expires</p>
                    <p className="font-semibold">{card.expiry}</p>
                  </div>
                </div>
              </div>

              {/* Locked Overlay */}
              {card.isLocked && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <Lock className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-semibold">Card Locked</p>
                  </div>
                </div>
              )}
            </div>

            {/* Card Actions */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                {card.isLocked ? (
                  <>
                    <Unlock className="w-4 h-4 mr-2" />
                    Unlock Card
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Lock Card
                  </>
                )}
              </Button>
              <Button variant="outline" className="flex-1">
                <CreditCard className="w-4 h-4 mr-2" />
                Details
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Cards;
