import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const Discounts = () => {
  const bills = useStore(state => state.bills);
  const employees = useStore(state => state.employees);
  const [activeTab, setActiveTab] = useState('total');

  const getStaffDisplay = (creatorName?: string) => {
    if (!creatorName) return 'Admin';
    const emp = employees.find(e => e.name === creatorName);
    return emp ? `${emp.name} (${emp.role})` : creatorName;
  };

  // Total Discounts (Cart level)
  const totalDiscounts = bills.filter(b => b.discount && b.discount > 0);

  // Item Wise Discounts
  const itemWiseDiscounts: {
    billId: string;
    customerName: string;
    itemName: string;
    totalBillCost: number;
    discountProvided: number;
    staff: string;
    date: string;
  }[] = [];

  bills.forEach(bill => {
    bill.items.forEach(item => {
      // If originalPrice exists and we charged less than originalPrice
      if (item.originalPrice && item.price < item.originalPrice) {
        const itemDiscount = (item.originalPrice - item.price) * item.qtyIssued * (item.days || 1);
        if (itemDiscount > 0) {
          itemWiseDiscounts.push({
            billId: bill.id,
            customerName: bill.customerName,
            itemName: item.name,
            totalBillCost: bill.totalCost,
            discountProvided: itemDiscount,
            staff: getStaffDisplay(bill.createdBy || item.handledBy),
            date: bill.eventDate || 'N/A'
          });
        }
      }
    });
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
              <p className="text-xs text-muted-foreground">Note: Item-wise discounts are calculated based on the standard inventory price at the exact time the item was added to the bill.</p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-foreground">Date</TableHead>
                    <TableHead className="font-semibold text-foreground">Customer Name</TableHead>
                    <TableHead className="font-semibold text-foreground">Item Name</TableHead>
                    <TableHead className="font-semibold text-foreground text-right">Final Bill Amount</TableHead>
                    <TableHead className="font-semibold text-foreground text-right text-emerald-600">Item Discount</TableHead>
                    <TableHead className="font-semibold text-foreground text-right">Staff</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemWiseDiscounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No item-wise discounts found for recent bills.</TableCell>
                    </TableRow>
                  ) : (
                    itemWiseDiscounts.map((discount, idx) => (
                      <TableRow key={`${discount.billId}-${idx}`}>
                        <TableCell className="font-medium">{discount.date}</TableCell>
                        <TableCell className="font-medium">{discount.customerName}</TableCell>
                        <TableCell>{discount.itemName}</TableCell>
                        <TableCell className="text-right">₹{discount.totalBillCost}</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">₹{discount.discountProvided}</TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">{discount.staff}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Discounts;
