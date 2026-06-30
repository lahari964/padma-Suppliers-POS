import { useState, useMemo, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { BillDetailsModal } from '../components/BillDetailsModal';
import { useStore } from '../store/useStore';
import { getBillDisplayInfo } from '../hooks/useBillCalculations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Search, Eye, Download, MessageCircle, Filter, MoreHorizontal, Edit, CreditCard, Trash, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
export default function Bills() {
  const bills = useStore(state => state.bills);
  const employees = useStore(state => state.employees);
  const deleteBill = useStore(state => state.deleteBill);
  const isDatabaseConnected = useStore(state => state.isDatabaseConnected);
  const preferences = useStore(state => state.preferences);
  const currentUser = useStore(state => state.currentUser);
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'overdue-payments') setActiveTab('pending');
    if (action === 'overdue-returns') setActiveTab('active');
    if (action === 'pending-billing') setActiveTab('upcoming');
  }, [searchParams]);
  
  const filteredBills = useMemo(() => {
    const action = searchParams.get('action');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    return [...bills].reverse().filter(b => {
      // 1. Search filter
      const matchesSearch = b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || b.mobile.includes(searchTerm);
      
      // 2. Employee filter
      let matchesEmployee = true;
      if (employeeFilter !== 'all') {
        const emp = employees.find(e => e.id === employeeFilter)?.name;
        matchesEmployee = b.createdBy === emp || b.items.some(i => i.handledBy === emp);
      }
      
      // 3. Date filter
      let matchesDate = true;
      if (dateFilter) {
        if (b.status === 'Settled') {
          const lastPayment = b.payments?.[b.payments.length - 1]?.date;
          matchesDate = lastPayment === dateFilter;
        } else {
          matchesDate = b.eventDate === dateFilter;
        }
      }

      // 4. Action filter (from Dashboard)
      let matchesAction = true;
      if (action === 'overdue-payments') {
        const paid = b.payments?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
        const balance = b.totalCost - paid - (b.discount || 0);
        matchesAction = balance > 0 && b.status === 'Pending' && !!b.paymentPromiseDate && b.paymentPromiseDate <= todayStr;
      } else if (action === 'overdue-returns') {
        const status = getBillDisplayInfo(b).status;
        matchesAction = (status === 'Active' || status === 'Partially Active') && !!b.expectedReturnDate && b.expectedReturnDate < todayStr;
      } else if (action === 'pending-billing') {
        matchesAction = !b.billingStarted && getBillDisplayInfo(b).status === 'Upcoming' && !!b.eventDate && b.eventDate <= todayStr;
      }

      return matchesSearch && matchesEmployee && matchesDate && matchesAction;
    });
  }, [bills, searchTerm, employeeFilter, dateFilter, employees, searchParams]);

  const upcomingBills = filteredBills.filter(b => ['Upcoming', 'Partially Active'].includes(getBillDisplayInfo(b).status));
  const activeBills = filteredBills.filter(b => ['Active', 'Partially Active'].includes(getBillDisplayInfo(b).status));
  const pendingBills = filteredBills.filter(b => b.status === 'Pending');
  const settledBills = filteredBills.filter(b => b.status === 'Settled');
  const quotationBills = filteredBills.filter(b => getBillDisplayInfo(b).status === 'Quotation');

  const getActiveData = () => {
    switch (activeTab) {
      case 'upcoming': return upcomingBills;
      case 'active': return activeBills;
      case 'pending': return pendingBills;
      case 'settled': return settledBills;
      case 'quotations': return quotationBills;
      default: return [];
    }
  };

  const formatToDDMMYYYY = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'dd-MM-yyyy');
    } catch(e) {
      return dateStr;
    }
  };


  const handleWhatsApp = (e: React.MouseEvent, bill: any) => {
    e.stopPropagation(); // Prevent opening modal
    const paid = bill.payments?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
    const balance = Math.max(0, bill.totalCost - paid - (bill.discount || 0));
    
    const text = `Hello ${bill.customerName},\n\nThis is a friendly update regarding your rental order (${bill.id}) with Padma Suppliers.\n\nTotal Amount: ₹${bill.totalCost}\nAdvance Paid: ₹${bill.advance}\nTotal Paid so far: ₹${paid}\n*Remaining Balance: ₹${balance}*\n\nPlease let us know if you have any questions. Thank you!`;
    
    const encodedText = encodeURIComponent(text);
    // Remove all non-numeric characters from mobile just in case
    const safeMobile = bill.mobile.replace(/\D/g, '');
    window.open(`https://wa.me/91${safeMobile}?text=${encodedText}`, '_blank');
  };

  const handleCancelOrder = (e: React.MouseEvent, billId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to cancel and delete this order?')) {
      deleteBill(billId);
      toast.success('Order cancelled successfully');
    }
  };

  const VirtualizedBillTable = ({ data, type }: { data: any[], type: string }) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const virtualizer = useVirtualizer({
      count: data.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 65,
      overscan: 5,
    });

    const items = virtualizer.getVirtualItems();

    return (
      <div ref={parentRef} className="bg-card rounded-xl border border-border shadow-sm overflow-auto max-h-[600px]">
        <Table>
          <TableHeader className="bg-muted/30 sticky top-0 z-10">
            <TableRow className="hover:bg-transparent">
              <TableHead className="hidden md:table-cell w-[100px]">Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="hidden md:table-cell text-right">Total (₹)</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Balance (₹)</TableHead>
              {currentUser?.role === 'Admin' && <TableHead className="w-[80px] text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No {type} bills found.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {items.length > 0 && <TableRow style={{ height: `${items[0].start}px` }} />}
                {items.map((virtualRow) => {
                  const bill = data[virtualRow.index];
                  return (
                    <TableRow 
                      key={bill.id} 
                      className="group cursor-pointer hover:bg-muted/50 h-[65px]"
                      onClick={() => setSelectedBillId(bill.id)}
                    >
                      <TableCell className="hidden md:table-cell font-medium text-xs text-muted-foreground">{bill.id}</TableCell>
                      <TableCell className="font-medium">{bill.customerName}</TableCell>
                      <TableCell>{bill.mobile}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className={
                          getBillDisplayInfo(bill).status === 'Quotation' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' :
                          bill.status === 'Settled' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          bill.status === 'Pending' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                          bill.status === 'Upcoming' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                          'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }>
                          {getBillDisplayInfo(bill).status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right font-medium">
                        {Number(bill.totalCost || 0).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-right">
                        <span className={bill.status === 'Settled' ? 'text-emerald-500 font-semibold' : 'text-orange-500 font-semibold'}>
                          {Math.max(0, Number(bill.totalCost || 0) - (bill.payments?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0) - (bill.discount || 0)).toLocaleString('en-IN')}
                        </span>
                      </TableCell>
                      {currentUser?.role === 'Admin' && (
                        <TableCell className="text-right">
                          {(getBillDisplayInfo(bill).status === 'Quotation' || getBillDisplayInfo(bill).status === 'Upcoming' || getBillDisplayInfo(bill).status === 'Active' || getBillDisplayInfo(bill).status === 'Partially Active') ? (
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" onClick={(e) => handleCancelOrder(e, bill.id)} title="Delete Bill">
                              <Trash className="w-4 h-4" />
                            </Button>
                          ) : null}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
                {items.length > 0 && <TableRow style={{ height: `${virtualizer.getTotalSize() - items[items.length - 1].end}px` }} />}
              </>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Bills & Orders</h2>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/new-bill')} className="gap-2">
            <Plus className="w-4 h-4" /> New Order
          </Button>
          <Button 
            onClick={() => navigate('/new-bill?type=quotation')} 
            variant="outline" 
            className="gap-2 border-purple-200 text-purple-700 bg-purple-50/50 hover:bg-purple-100 hover:text-purple-800 hover:border-purple-300 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-900/50 dark:hover:text-purple-200 dark:bg-purple-950/30"
          >
            <FileText className="w-4 h-4 text-purple-500 dark:text-purple-400" /> New Quotation
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search customer name or mobile..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
        
        <div className="flex w-full md:w-auto gap-4 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger className="w-[160px] bg-background">
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Date Filter:</span>
            <DatePicker 
              value={dateFilter} 
              onChange={setDateFilter} 
              className="w-[140px]"
            />
            {dateFilter && (
              <Button variant="ghost" size="sm" onClick={() => setDateFilter('')} className="h-8 text-xs text-destructive">Clear</Button>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full h-auto p-1 bg-transparent flex flex-nowrap overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-2 sm:gap-3 justify-start items-center border-none shadow-none">
          <TabsTrigger 
            value="upcoming" 
            className="snap-start shrink-0 rounded-full border border-border bg-card hover:bg-muted/60 px-5 py-2.5 text-sm font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary shadow-sm hover:shadow data-[state=active]:shadow-md"
          >
            Upcoming ({upcomingBills.length})
          </TabsTrigger>
          <TabsTrigger 
            value="active" 
            className="snap-start shrink-0 rounded-full border border-border bg-card hover:bg-muted/60 px-5 py-2.5 text-sm font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary shadow-sm hover:shadow data-[state=active]:shadow-md"
          >
            Active ({activeBills.length})
          </TabsTrigger>
          <TabsTrigger 
            value="pending" 
            className="snap-start shrink-0 rounded-full border border-border bg-card hover:bg-muted/60 px-5 py-2.5 text-sm font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary shadow-sm hover:shadow data-[state=active]:shadow-md"
          >
            Pending ({pendingBills.length})
          </TabsTrigger>
          <TabsTrigger 
            value="settled" 
            className="snap-start shrink-0 rounded-full border border-border bg-card hover:bg-muted/60 px-5 py-2.5 text-sm font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary shadow-sm hover:shadow data-[state=active]:shadow-md"
          >
            Settled ({settledBills.length})
          </TabsTrigger>
          <TabsTrigger 
            value="quotations" 
            className="snap-start shrink-0 rounded-full border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 px-5 py-2.5 text-sm font-medium transition-all duration-300 data-[state=active]:bg-purple-600 data-[state=active]:text-white dark:data-[state=active]:text-white data-[state=active]:border-purple-600 shadow-sm hover:shadow data-[state=active]:shadow-md"
          >
            Quotations ({quotationBills.length})
          </TabsTrigger>
        </TabsList>
        <div className="mt-4 relative">
          <TabsContent value="upcoming" className="animate-in fade-in slide-in-from-bottom-2 duration-200 ease-out">{renderTable(upcomingBills, 'upcoming')}</TabsContent>
          <TabsContent value="active" className="animate-in fade-in slide-in-from-bottom-2 duration-200 ease-out">{renderTable(activeBills, 'active')}</TabsContent>
          <TabsContent value="pending" className="animate-in fade-in slide-in-from-bottom-2 duration-200 ease-out">{renderTable(pendingBills, 'pending')}</TabsContent>
          <TabsContent value="settled" className="animate-in fade-in slide-in-from-bottom-2 duration-200 ease-out">{renderTable(settledBills, 'settled')}</TabsContent>
          <TabsContent value="quotations" className="animate-in fade-in slide-in-from-bottom-2 duration-200 ease-out">{renderTable(quotationBills, 'quotations')}</TabsContent>
        </div>
      </Tabs>

      <BillDetailsModal 
        isOpen={!!selectedBillId} 
        onClose={() => setSelectedBillId(null)} 
        billId={selectedBillId} 
      />
    </div>
  );
}
