import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Tag, ReceiptText, LayoutList, GripHorizontal } from 'lucide-react';

const mockItems = [
  { name: 'Pelli peta steel', qty: 3, stdPrice: 50, billedPrice: 50 },
  { name: 'Zumbo cooler', qty: 3, stdPrice: 1500, billedPrice: 1500 },
  { name: 'Tivachi', qty: 5, stdPrice: 300, billedPrice: 300 },
  { name: 'Pendal 18*18', qty: 3, stdPrice: 2000, billedPrice: 2000 },
  // Adding one with a discount for demonstration purposes
  { name: 'Premium Sofa', qty: 2, stdPrice: 1000, billedPrice: 800 },
];

export default function DesignPreview() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 space-y-12 max-w-md mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold font-serif">Table Alternatives</h1>
        <p className="text-muted-foreground text-sm">Compare 4 different ways to display item details on mobile.</p>
      </div>

      {/* Option 1: Vertical Mini-Cards */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-semibold border-b border-border pb-2">
          <LayoutList className="w-5 h-5" /> Option 1: Vertical Cards
        </div>
        <div className="space-y-3">
          {mockItems.map((item, idx) => {
            const itemDiscount = (item.stdPrice - item.billedPrice) * item.qty;
            return (
              <div key={idx} className="bg-card border border-border rounded-xl p-3 shadow-sm flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-sm">{item.name}</span>
                  {itemDiscount > 0 && (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs">
                      -₹{itemDiscount}
                    </Badge>
                  )}
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
                  <div>
                    <span className="block">Qty: {item.qty}</span>
                  </div>
                  <div className="text-right">
                    <span className={itemDiscount > 0 ? "line-through opacity-70" : ""}>Std: ₹{item.stdPrice}</span>
                    {itemDiscount > 0 && <span className="block text-foreground font-medium">Billed: ₹{item.billedPrice}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Option 2: Expandable Accordions */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-semibold border-b border-border pb-2">
          <ChevronDown className="w-5 h-5" /> Option 2: Expandable List
        </div>
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          {mockItems.map((item, idx) => {
            const itemDiscount = (item.stdPrice - item.billedPrice) * item.qty;
            const isExpanded = expandedId === idx;
            return (
              <div key={idx} className="border-b border-border last:border-0">
                <div 
                  className="p-3 flex justify-between items-center hover:bg-muted/50 active:bg-muted transition-colors cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : idx)}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    <span className="font-medium text-sm">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {itemDiscount > 0 && <span className="text-xs font-medium text-emerald-500">-₹{itemDiscount}</span>}
                    <span className="text-sm font-semibold">₹{item.billedPrice * item.qty}</span>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-9 pb-3 pt-1 text-xs text-muted-foreground bg-muted/10 grid grid-cols-2 gap-2">
                    <div>Quantity: <span className="text-foreground font-medium">{item.qty}</span></div>
                    <div>Std Price: <span className="text-foreground font-medium">₹{item.stdPrice}</span></div>
                    {itemDiscount > 0 && <div>Discount: <span className="text-emerald-500 font-medium">-₹{item.stdPrice - item.billedPrice}/ea</span></div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Option 3: Digital Receipt */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-semibold border-b border-border pb-2">
          <ReceiptText className="w-5 h-5" /> Option 3: Minimal Receipt
        </div>
        <div className="bg-card border border-dashed border-muted-foreground/40 rounded-xl p-4 shadow-sm font-mono text-sm">
          <div className="flex justify-between font-bold pb-2 border-b border-dashed border-muted-foreground/40 mb-2">
            <span>Item</span>
            <span>Total</span>
          </div>
          <div className="space-y-3">
            {mockItems.map((item, idx) => {
              const itemDiscount = (item.stdPrice - item.billedPrice) * item.qty;
              return (
                <div key={idx} className="flex justify-between items-start">
                  <div>
                    <span className="block text-foreground">{item.name} <span className="text-xs text-muted-foreground">x{item.qty}</span></span>
                    {itemDiscount > 0 && <span className="text-xs text-emerald-500 block">-₹{itemDiscount} saved</span>}
                  </div>
                  <div className="text-right">
                    <span>₹{item.billedPrice * item.qty}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Option 4: Horizontal Carousel */}
      <section className="space-y-4 overflow-hidden">
        <div className="flex items-center gap-2 text-primary font-semibold border-b border-border pb-2">
          <GripHorizontal className="w-5 h-5" /> Option 4: Swipeable Carousel
        </div>
        <div className="flex overflow-x-auto gap-3 pb-4 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
          {mockItems.map((item, idx) => {
            const itemDiscount = (item.stdPrice - item.billedPrice) * item.qty;
            return (
              <div key={idx} className="bg-card border border-border rounded-xl p-4 shadow-sm min-w-[200px] flex-shrink-0 snap-center flex flex-col justify-between gap-4">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-sm line-clamp-1">{item.name}</span>
                    <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-xs text-muted-foreground block">Qty: {item.qty}</span>
                </div>
                <div>
                  {itemDiscount > 0 && <span className="text-xs text-emerald-500 font-medium block mb-0.5">-₹{itemDiscount} Off</span>}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-bold">₹{item.billedPrice}</span>
                    {itemDiscount > 0 && <span className="text-xs text-muted-foreground line-through">₹{item.stdPrice}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      
      <div className="h-20"></div>
    </div>
  );
}
