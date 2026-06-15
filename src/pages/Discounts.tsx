import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bill } from '../types';

const Discounts = () => {
  const bills = useStore(state => state.bills);
  const employees = useStore(state => state.employees);
  const [activeTab, setActiveTab] = useState('total');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const getStaffDisplay = (creatorName?: string) => {
    if (!creatorName) return 'Admin';
    const emp = employees.find(e => e.name === creatorName);
    return emp ? `${emp.name} (${emp.role})` : creatorName;
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

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground">Discounts</h1>
          <p className="text-muted-foreground mt-1">Track all discounts provided to customers.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 w-full justify-start h-auto p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="total" className="text-base px-6 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Total Discount</TabsTrigger>
          <TabsTrigger value="item" className="text-base px-6 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Item-Wise Discount</TabsTrigger>
        </TabsList>
        
        <TabsContent value="total" className="mt-0 outline-none">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-foreground">Date</TableHead>
                    <TableHead className="font-semibold text-foreground">Customer Name</TableHead>
                    <TableHead className="font-semibold text-foreground text-right">Final Bill Amount</TableHead>
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
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">{bill.eventDate || 'N/A'}</TableCell>
                        <TableCell className="font-medium">{bill.customerName}</TableCell>
                        <TableCell className="text-right">₹{bill.totalCost}</TableCell>
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
                    <TableHead className="font-semibold text-foreground">Date</TableHead>
                    <TableHead className="font-semibold text-foreground">Customer Name</TableHead>
                    <TableHead className="font-semibold text-foreground text-right">Final Bill Amount</TableHead>
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
                        <TableCell className="font-medium">{bill.eventDate || 'N/A'}</TableCell>
                        <TableCell className="font-medium">{bill.customerName}</TableCell>
                        <TableCell className="text-right">₹{bill.totalCost}</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">₹{totalItemDiscount}</TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">{getStaffDisplay(bill.createdBy)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <Dialog open={!!selectedBill} onOpenChange={(open) => !open && setSelectedBill(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Discounted Items for {selectedBill?.customerName}</DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto max-h-[60vh] mt-4 rounded-md border border-border">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead className="text-right">Std Price</TableHead>
                      <TableHead className="text-right">Billed Price</TableHead>
                      <TableHead className="text-right text-emerald-600">Discount</TableHead>
                      <TableHead className="text-right">Staff</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedBill?.items.map((item, idx) => {
                      const hasDiscount = item.originalPrice && item.price < item.originalPrice;
                      const itemDiscount = hasDiscount ? (item.originalPrice! - item.price) * item.qtyIssued * (item.days || 1) : 0;
                      return (
                        <TableRow key={idx} className={hasDiscount ? "bg-emerald-50 dark:bg-emerald-950/20" : ""}>
                          <TableCell className={hasDiscount ? "font-semibold text-emerald-700 dark:text-emerald-400" : ""}>{item.name}</TableCell>
                          <TableCell>{item.qtyIssued}</TableCell>
                          <TableCell className="text-right">₹{item.originalPrice || item.price}</TableCell>
                          <TableCell className="text-right font-medium">₹{item.price}</TableCell>
                          <TableCell className="text-right font-bold text-emerald-600">
                            {hasDiscount ? `₹${itemDiscount}` : '-'}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground text-xs">
                            {hasDiscount ? getStaffDisplay(item.handledBy || selectedBill.createdBy) : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Discounts;
