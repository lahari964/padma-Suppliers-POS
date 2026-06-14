import { useState, useMemo, useEffect } from 'react';
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
  const { bills, employees, deleteBill, isDatabaseConnected, preferences, currentUser } = useStore();
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

  const getActiveData = () => {
    switch (activeTab) {
      case 'upcoming': return upcomingBills;
      case 'active': return activeBills;
      case 'pending': return pendingBills;
      case 'settled': return settledBills;
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

  const exportToCSV = () => {
    if (!isDatabaseConnected) {
      toast.error('Database is not connected. Cannot export file.');
      return;
    }

    const data = getActiveData();
    if (data.length === 0) {
      toast.error(`No bills found in the ${activeTab} tab to export.`);
      return;
    }
    
    try {
      const headers = ['Bill ID', 'Customer Name', 'Mobile', 'Status', 'Event Date', 'Total Cost', 'Settled', 'Balance'];
      const rows = data.map(b => {
        const paid = b.payments?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
        const balance = b.totalCost - paid - (b.discount || 0);
        return [
          b.id,
          `"${b.customerName}"`,
          b.mobile,
          getBillDisplayInfo(b).status,
          formatToDDMMYYYY(b.eventDate || ''),
          b.totalCost,
          paid,
          Math.max(0, balance)
        ];
      });
      
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `PadmaPOS_${activeTab}_bills_${format(new Date(), 'dd-MM-yyyy')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('CSV Exported Successfully');
    } catch (e) {
      toast.error('Failed to export CSV');
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

  const renderTable = (data: any[], type: string) => (
    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden mt-4">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Bill ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total (₹)</TableHead>
            <TableHead className="text-right">Balance (₹)</TableHead>
            <TableHead className="w-[120px] text-right">Actions</TableHead>
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
            data.map(bill => (
              <TableRow 
                key={bill.id} 
                className="group cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedBillId(bill.id)}
              >
                <TableCell className="font-medium text-xs text-muted-foreground">{bill.id}</TableCell>
                <TableCell className="font-medium">{bill.customerName}</TableCell>
                <TableCell>{bill.mobile}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={
                    bill.status === 'Settled' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    bill.status === 'Pending' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                    bill.status === 'Upcoming' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                    'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }>
                    {getBillDisplayInfo(bill).status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {Number(bill.totalCost || 0).toLocaleString('en-IN')}
                </TableCell>
                <TableCell className="text-right">
                  <span className={bill.status === 'Settled' ? 'text-emerald-500 font-semibold' : 'text-orange-500 font-semibold'}>
                    {Math.max(0, Number(bill.totalCost || 0) - (bill.payments?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0) - (bill.discount || 0)).toLocaleString('en-IN')}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0" onClick={e => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedBillId(bill.id); }}>
                        <Eye className="w-4 h-4 mr-2" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedBillId(bill.id); }}>
                        <Edit className="w-4 h-4 mr-2" /> Edit Order
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedBillId(bill.id); }}>
                        <CreditCard className="w-4 h-4 mr-2" /> Add Payment
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />

                      <DropdownMenuItem onClick={(e) => handleWhatsApp(e, bill)}>
                        <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {currentUser?.role !== 'Staff' && (
                        <DropdownMenuItem onClick={(e) => handleCancelOrder(e, bill.id)} className="text-destructive focus:text-destructive">
                          <Trash className="w-4 h-4 mr-2" /> Cancel Order
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Bills & Orders</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportToCSV} className="gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>

          <Button onClick={() => navigate('/new-bill')} className="gap-2">
            <Plus className="w-4 h-4" /> New Order
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
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="upcoming">Upcoming ({upcomingBills.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeBills.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingBills.length})</TabsTrigger>
          <TabsTrigger value="settled">Settled ({settledBills.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">{renderTable(upcomingBills, 'upcoming')}</TabsContent>
        <TabsContent value="active">{renderTable(activeBills, 'active')}</TabsContent>
        <TabsContent value="pending">{renderTable(pendingBills, 'pending')}</TabsContent>
        <TabsContent value="settled">{renderTable(settledBills, 'settled')}</TabsContent>
      </Tabs>

      <BillDetailsModal 
        isOpen={!!selectedBillId} 
        onClose={() => setSelectedBillId(null)} 
        billId={selectedBillId} 
      />
    </div>
  );
}
