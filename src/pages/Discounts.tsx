import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Bill } from '../types';
import { formatDateDisplay } from '../lib/utils';

const Discounts = () => {
  const bills = useStore(state => state.bills);
  const employees = useStore(state => state.employees);
  const [activeTab, setActiveTab] = useState('total');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const getStaffDisplay = (creatorName?: string) => {
    return creatorName || 'System';
  };

  // Total Discounts (Cart level)
  const totalDiscounts = bills.filter(b => b.discount && b.discount > 0);

  // Group by bill for Item Wise
  const billsWithItemDiscounts = bills.filter(bill => 
    bill.items.some(item => item.originalPrice && item.price < item.originalPrice)
  ).map(bill => {
    let totalItemDiscount = 0;
    bill.items.forEach(item => {
      if (item.originalPrice && item.price < item.originalPrice) {
        totalItemDiscount += (item.originalPrice - item.price) * item.qtyIssued * (item.days || 1);
      }
    });
    return { bill, totalItemDiscount };
  });

  // Calculate discount summaries for the selected bill
  let selectedCartDiscount = 0;
  let selectedItemDiscount = 0;
  if (selectedBill) {
    selectedCartDiscount = selectedBill.discount || 0;
    selectedBill.items.forEach(item => {
      if (item.originalPrice && item.price < item.originalPrice) {
        selectedItemDiscount += (item.originalPrice - item.price) * item.qtyIssued * (item.days || 1);
      }
    });
  }
  const selectedTotalDiscount = selectedCartDiscount + selectedItemDiscount;

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground">Discounts</h1>
          <p className="text-muted-foreground mt-1">Track all discounts provided to customers.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 md:mb-6 grid w-full grid-cols-2 md:w-auto md:inline-flex h-auto p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="total" className="text-xs sm:text-sm md:text-base px-2 sm:px-6 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Total Discount</TabsTrigger>
          <TabsTrigger value="item" className="text-xs sm:text-sm md:text-base px-2 sm:px-6 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Item-Wise Discount</TabsTrigger>
        </TabsList>
        
        <TabsContent value="total" className="mt-0 outline-none">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-foreground hidden sm:table-cell">Date</TableHead>
                    <TableHead className="font-semibold text-foreground">Customer Name</TableHead>
                    <TableHead className="font-semibold text-foreground text-right hidden sm:table-cell">Final Bill Amount</TableHead>
                    <TableHead className="font-semibold text-foreground text-right text-emerald-600">Discount Provided</TableHead>
                    <TableHead className="font-semibold text-foreground text-right">Staff</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {totalDiscounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No cart-level discounts found.</TableCell>
                    </TableRow>
                  ) : (
                    totalDiscounts.map(bill => (
                      <TableRow 
                        key={bill.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedBill(bill)}
                      >
                        <TableCell className="font-medium hidden sm:table-cell">{formatDateDisplay(bill.eventDate)}</TableCell>
                        <TableCell className="font-medium max-w-[150px] truncate">{bill.customerName}</TableCell>
                        <TableCell className="text-right hidden sm:table-cell">₹{bill.totalCost}</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">₹{bill.discount}</TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">{getStaffDisplay(bill.createdBy)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="item" className="mt-0 outline-none">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 bg-muted/20 border-b border-border">
              <p className="text-xs text-muted-foreground">Click on a bill to view the exact items that were discounted.</p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-foreground hidden sm:table-cell">Date</TableHead>
                    <TableHead className="font-semibold text-foreground">Customer Name</TableHead>
                    <TableHead className="font-semibold text-foreground text-right hidden sm:table-cell">Final Bill Amount</TableHead>
                    <TableHead className="font-semibold text-foreground text-right text-emerald-600">Total Item Discounts</TableHead>
                    <TableHead className="font-semibold text-foreground text-right">Staff</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billsWithItemDiscounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No item-wise discounts found for recent bills.</TableCell>
                    </TableRow>
                  ) : (
                    billsWithItemDiscounts.map(({ bill, totalItemDiscount }) => (
                      <TableRow 
                        key={bill.id} 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedBill(bill)}
                      >
                        <TableCell className="font-medium hidden sm:table-cell">{formatDateDisplay(bill.eventDate)}</TableCell>
                        <TableCell className="font-medium max-w-[150px] truncate">{bill.customerName}</TableCell>
                        <TableCell className="text-right hidden sm:table-cell">₹{bill.totalCost}</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">₹{totalItemDiscount}</TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">{getStaffDisplay(bill.createdBy)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedBill} onOpenChange={(open) => !open && setSelectedBill(null)}>
        <DialogContent className="max-w-3xl max-h-[90dvh] overflow-y-auto flex flex-col">
          <DialogHeader>
            <DialogTitle>Discount Details for {selectedBill?.customerName}</DialogTitle>
          </DialogHeader>
          
          {selectedTotalDiscount > 0 ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mt-2">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm text-emerald-800 dark:text-emerald-400 font-medium mb-1">Total Discount Provided</p>
                  <h4 className="text-3xl font-bold text-emerald-700 dark:text-emerald-500">₹{selectedTotalDiscount}</h4>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Authorized By</p>
                  <p className="font-semibold text-foreground">{getStaffDisplay(selectedBill?.createdBy)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 border-t border-emerald-200/50 dark:border-emerald-800/50 pt-3">
                <div>
                  <p className="text-[10px] sm:text-xs text-emerald-800/70 dark:text-emerald-400/70 font-medium uppercase tracking-wide">Date</p>
                  <p className="font-semibold text-emerald-700 dark:text-emerald-500 text-sm sm:text-base">{formatDateDisplay(selectedBill?.eventDate)}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-emerald-800/70 dark:text-emerald-400/70 font-medium uppercase tracking-wide">Final Bill Amt</p>
                  <p className="font-semibold text-emerald-700 dark:text-emerald-500 text-sm sm:text-base">₹{selectedBill?.totalCost}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-emerald-800/70 dark:text-emerald-400/70 font-medium uppercase tracking-wide">Cart-Level Discount</p>
                  <p className="font-semibold text-emerald-700 dark:text-emerald-500 text-sm sm:text-base">₹{selectedCartDiscount}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-emerald-800/70 dark:text-emerald-400/70 font-medium uppercase tracking-wide">Item-Wise Sum</p>
                  <p className="font-semibold text-emerald-700 dark:text-emerald-500 text-sm sm:text-base">₹{selectedItemDiscount}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="overflow-auto max-h-[50vh] mt-2 space-y-3 pb-2">
            {selectedBill?.items.map((item, idx) => {
              const hasDiscount = item.originalPrice && item.price < item.originalPrice;
              const itemDiscount = hasDiscount ? (item.originalPrice! - item.price) * item.qtyIssued * (item.days || 1) : 0;
              return (
                <div key={idx} className="bg-card border border-border rounded-xl p-3 shadow-sm flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-sm">{item.name}</span>
                    {hasDiscount && (
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs shrink-0">
                        -₹{itemDiscount}
                      </Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
                    <div>
                      <span className="block">Qty: {item.qtyIssued}</span>
                    </div>
                    <div className="text-right">
                      <span className={hasDiscount ? "line-through opacity-70" : ""}>Std: ₹{item.originalPrice || item.price}</span>
                      {hasDiscount && <span className="block text-foreground font-medium mt-0.5">Billed: ₹{item.price}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Discounts;
