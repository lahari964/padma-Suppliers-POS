import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Package, Truck, FileText, CheckCircle, Search, Filter, Printer, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '../store/useStore';
import { Bill, PaymentLog } from '../types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { toast } from '@/components/ui/sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentModalBillId, setPaymentModalBillId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  
  const { bills, updateBill, preferences, currentUser } = useStore();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = monthStart;
  const days = eachDayOfInterval({ start: startDate, end: monthEnd });
  const startingDayIndex = getDay(monthStart);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const selectedBills = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const matchesDate = bills.filter(b => b.eventDate === dateStr || b.expectedReturnDate === dateStr);
    
    // Filter by search query if any
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return matchesDate.filter(b => b.customerName.toLowerCase().includes(q) || b.mobile.includes(q));
    }
    
    // Return unique bills
    return Array.from(new Set(matchesDate));
  }, [selectedDate, bills, searchQuery]);



  const handleRecordPayment = () => {
    if (!paymentModalBillId || !paymentAmount || Number(paymentAmount) <= 0) return;
    
    const bill = bills.find(b => b.id === paymentModalBillId);
    if (!bill) return;

    const newPayments = [...(bill.payments || []), {
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: Number(paymentAmount),
      method: 'Cash',
      receivedBy: currentUser?.name || 'System'
    }] as PaymentLog[];

    const totalPaid = newPayments.reduce((acc, p) => acc + p.amount, 0);
    const newRemaining = bill.totalCost - totalPaid - (bill.discount || 0);
    
    let newStatus = bill.status;
    if (newRemaining <= 0) {
      const allReturned = bill.items.every(i => (i.qtyReturned || 0) >= i.qtyIssued);
      if (allReturned) newStatus = 'Settled';
    }

    const newAuditLog = {
      timestamp: Date.now(),
      action: 'Payment Added',
      employeeName: currentUser?.name || 'System',
      details: `Amount: ₹${paymentAmount}. New Status: ${newStatus}`
    };

    updateBill(bill.id, { 
      payments: newPayments, 
      status: newStatus as any,
      auditTrail: [...(bill.auditTrail || []), newAuditLog]
    });

    setPaymentAmount('');
    setPaymentModalBillId(null);
    toast.success('Payment recorded successfully');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col">
      {/* Header & Search Area */}
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold font-serif flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-foreground" />
          Calendar View
        </h2>
        
        <div className="bg-card border border-border rounded-xl p-3 flex flex-col md:flex-row items-center gap-4 shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by customer name or mobile number..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-transparent focus-visible:border-primary w-full shadow-none" 
            />
          </div>
          <div className="w-px h-6 bg-border hidden md:block"></div>
          <Select defaultValue="all">
            <SelectTrigger className="w-full md:w-[200px] bg-transparent border-none shadow-none focus:ring-0">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Employees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Return Calendar Area */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="p-6 border-b border-border">
          <h3 className="text-xl font-bold font-serif text-foreground">Return Calendar</h3>
        </div>
        
        <div className="flex flex-col lg:flex-row p-6 gap-8 h-full">
          
          {/* Left Column (Calendar) */}
          <div className="w-full lg:w-[320px] shrink-0">
            <div className="border border-border rounded-xl p-4 bg-background/50">
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" onClick={prevMonth}>
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                </Button>
                <h3 className="font-bold text-sm text-foreground">{format(currentDate, 'MMMM yyyy')}</h3>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
              
              <div className="grid grid-cols-7 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <div key={day} className="py-2 text-center text-[11px] font-semibold text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-y-1">
                {Array.from({ length: startingDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-10"></div>
                ))}
                {days.map((day) => {
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isTodayDate = isToday(day);
                  const isSelected = isSameDay(day, selectedDate);
                  
                  return (
                    <div key={day.toString()} className="h-10 flex items-center justify-center">
                      <button 
                        onClick={() => setSelectedDate(day)}
                        className={`relative flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all ${
                          !isCurrentMonth ? 'text-muted-foreground/30' : 'text-foreground hover:bg-muted'
                        } ${isSelected ? 'border-[2px] border-primary text-foreground font-bold shadow-sm' : ''} ${
                          isTodayDate && !isSelected ? 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 font-bold' : ''
                        }`}
                      >
                        {format(day, 'd')}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Right Column (Schedule) */}
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold font-serif text-foreground">Schedule for {format(selectedDate, 'd MMM yyyy')}</h3>
              <Select defaultValue="all">
                <SelectTrigger className="w-[160px] bg-background border-border shadow-sm">
                  <SelectValue placeholder="All Activities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {selectedBills.length === 0 ? (
                <div className="text-center py-20 bg-background/50 rounded-xl border border-dashed border-border flex flex-col items-center justify-center">
                  <CalendarIcon className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-medium">No activities scheduled for {format(selectedDate, 'dd MMM yyyy')}</p>
                </div>
              ) : (
                selectedBills.map(bill => {
                  const paid = bill.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
                  const balance = bill.totalCost - paid - (bill.discount || 0);
                  const isFullyPaid = balance <= 0;
                  
                  return (
                    <div key={bill.id} className="p-5 rounded-xl border border-border bg-background/50 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-bold text-primary">{bill.customerName}</h4>
                          <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400 border-none font-semibold h-5 px-2.5 text-[10px] rounded-full uppercase tracking-wider">
                            {bill.status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-base text-foreground">₹{bill.totalCost}</div>
                          <div className="text-[10px] text-muted-foreground uppercase font-mono">{bill.id}</div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-4">
                        {bill.mobile}
                      </div>
                      
                      {bill.items.length > 0 && (
                        <div className="space-y-1.5 mb-5 bg-card border border-border/50 rounded-lg p-3">
                          {bill.items.map(item => {
                            let itemStatus = 'Pending';
                            let statusColor = 'text-orange-500';
                            if (item.qtyReturned && item.qtyReturned >= item.qtyIssued) {
                              itemStatus = 'Returned';
                              statusColor = 'text-emerald-500';
                            } else if (item.isDispatched) {
                              itemStatus = 'Sent';
                              statusColor = 'text-emerald-500';
                            }
                            
                            return (
                              <div key={item.id} className="flex justify-between items-center text-sm">
                                <span className="font-medium text-muted-foreground">{item.qtyIssued}x {item.name}</span>
                                <span className={`font-semibold text-xs ${statusColor}`}>{itemStatus}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                        <Button variant="outline" size="sm" onClick={() => setPaymentModalBillId(bill.id)} className="h-8 rounded-full px-4 text-xs font-medium bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/20">
                          <CreditCard className="w-3.5 h-3.5 mr-2" /> Add Payment
                        </Button>
                        <Button size="sm" className={`h-8 rounded-full px-4 text-xs font-medium ${isFullyPaid ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-muted text-muted-foreground hover:bg-muted'}`}>
                          <CheckCircle className="w-3.5 h-3.5 mr-2" /> {isFullyPaid ? 'Paid' : 'Unpaid'}
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
        </div>
      </div>

      <Dialog open={!!paymentModalBillId} onOpenChange={(open) => !open && setPaymentModalBillId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount (₹)
              </Label>
              <Input
                id="amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="col-span-3"
                placeholder="Enter amount"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentModalBillId(null)}>Cancel</Button>
            <Button type="submit" onClick={handleRecordPayment}>Save Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}