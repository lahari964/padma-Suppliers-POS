import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Package, Truck, Search, Filter, CheckCircle, CreditCard, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '../store/useStore';
import { Bill } from '../types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getBillDisplayInfo } from '../hooks/useBillCalculations';
import { BillDetailsModal } from '@/components/BillDetailsModal';

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  
  const { bills } = useStore();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = monthStart;
  const days = eachDayOfInterval({ start: startDate, end: monthEnd });
  const startingDayIndex = getDay(monthStart);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Pre-calculate events mapped to dates for performance
  const calendarEventsByDate = useMemo(() => {
    const map: Record<string, { upcoming: Bill[], returns: Bill[], payments: Bill[], active: Bill[] }> = {};
    
    const initDay = (dateStr: string) => {
      if (!map[dateStr]) map[dateStr] = { upcoming: [], returns: [], payments: [], active: [] };
    };

    const todayStr = format(new Date(), 'yyyy-MM-dd');

    bills.forEach(bill => {
      const info = getBillDisplayInfo(bill);
      const isSettled = info.status === 'Settled';
      
      // Upcoming Dispatches (Event Date)
      if (bill.eventDate && !isSettled) {
        initDay(bill.eventDate);
        map[bill.eventDate].upcoming.push(bill);
      }
      
      // Active / Expected Returns (Expected Return Date)
      if (bill.expectedReturnDate && !isSettled) {
        initDay(bill.expectedReturnDate);
        map[bill.expectedReturnDate].returns.push(bill);
        
        // Let's mark as "overdue" if it's past today, but we map it to its expected date
        if (info.status === 'Active' || info.status === 'Partially Active') {
          map[bill.expectedReturnDate].active.push(bill);
        }
      }
      
      // Pending Payments (Promise Date)
      if (bill.paymentPromiseDate && info.status === 'Pending') {
        const paid = bill.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
        const balance = bill.totalCost - paid - (bill.discount || 0);
        if (balance > 0) {
          initDay(bill.paymentPromiseDate);
          map[bill.paymentPromiseDate].payments.push(bill);
        }
      }
    });
    return map;
  }, [bills]);

  // Aggregate selected day's data
  const selectedDateEvents = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dayData = calendarEventsByDate[dateStr] || { upcoming: [], returns: [], payments: [], active: [] };
    
    let combined = [...dayData.upcoming, ...dayData.returns, ...dayData.payments];
    
    if (filterType === 'upcoming') combined = dayData.upcoming;
    if (filterType === 'returns') combined = dayData.returns;
    if (filterType === 'payments') combined = dayData.payments;
    
    let unique = Array.from(new Set(combined));
    
    if (filterType === 'active') {
       unique = unique.filter(b => getBillDisplayInfo(b).status === 'Active' || getBillDisplayInfo(b).status === 'Partially Active');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      unique = unique.filter(b => b.customerName.toLowerCase().includes(q) || b.mobile.includes(q));
    }
    
    return unique;
  }, [selectedDate, calendarEventsByDate, filterType, searchQuery]);

  // Selected Day Summary Stats
  const daySummary = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dayData = calendarEventsByDate[dateStr] || { upcoming: [], returns: [], payments: [], active: [] };
    
    let totalDue = 0;
    dayData.payments.forEach(b => {
      const paid = b.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
      totalDue += b.totalCost - paid - (b.discount || 0);
    });

    return {
      dispatches: dayData.upcoming.length,
      returns: dayData.returns.length,
      paymentsDue: totalDue
    };
  }, [selectedDate, calendarEventsByDate]);

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
              placeholder="Search by customer name or mobile..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-transparent focus-visible:border-primary w-full shadow-none" 
            />
          </div>
          <div className="w-px h-6 bg-border hidden md:block"></div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-[220px] bg-transparent border-none shadow-none focus:ring-0">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Activities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="upcoming">Upcoming Dispatches</SelectItem>
              <SelectItem value="active">Active Bills</SelectItem>
              <SelectItem value="returns">Expected Returns</SelectItem>
              <SelectItem value="payments">Payments Due</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Calendar Area */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-xl font-bold font-serif text-foreground">Activity Calendar</h3>
          
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Dispatch</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Return</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> Overdue</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500"></div> Payment</div>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row p-4 sm:p-6 gap-6 sm:gap-8 h-full">
          
          {/* Left Column (Calendar Grid) */}
          <div className="w-full lg:w-[420px] shrink-0">
            <div className="border border-border rounded-xl p-4 sm:p-6 bg-background/50 shadow-inner">
              <div className="flex items-center justify-between mb-6">
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-full bg-background" onClick={prevMonth}>
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                </Button>
                <h3 className="font-bold text-lg text-foreground tracking-tight">{format(currentDate, 'MMMM yyyy')}</h3>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-full bg-background" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
              
              <div className="grid grid-cols-7 mb-3">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="py-2 text-center text-[11px] font-bold text-muted-foreground tracking-wider uppercase">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-y-2">
                {Array.from({ length: startingDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-10"></div>
                ))}
                {days.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const todayStr = format(new Date(), 'yyyy-MM-dd');
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isTodayDate = isToday(day);
                  const isSelected = isSameDay(day, selectedDate);
                  
                  const dayData = calendarEventsByDate[dateStr];
                  const hasUpcoming = dayData && dayData.upcoming.length > 0;
                  const hasReturns = dayData && dayData.returns.length > 0;
                  const hasOverdueReturns = hasReturns && dateStr < todayStr;
                  const hasPayments = dayData && dayData.payments.length > 0;
                  
                  return (
                    <div key={day.toString()} className="h-10 flex items-center justify-center">
                      <button 
                        onClick={() => setSelectedDate(day)}
                        className={`relative flex items-center justify-center w-9 h-9 rounded-full text-sm font-medium transition-all ${
                          isSelected 
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-md' 
                            : isTodayDate 
                              ? 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 font-bold hover:bg-sky-200 dark:hover:bg-sky-900/50' 
                              : !isCurrentMonth 
                                ? 'text-muted-foreground/30 hover:bg-muted/50' 
                                : 'text-foreground hover:bg-muted'
                        }`}
                      >
                        {format(day, 'd')}
                        
                        {/* Status Dots */}
                        <div className="absolute -bottom-1 flex justify-center gap-[2px]">
                          {hasUpcoming && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} title="Dispatches"></div>}
                          {hasReturns && !hasOverdueReturns && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-amber-500'}`} title="Expected Returns"></div>}
                          {hasOverdueReturns && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-red-500'}`} title="Overdue Returns"></div>}
                          {hasPayments && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-orange-500'}`} title="Payments Due"></div>}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Right Column (Schedule & Summary) */}
          <div className="flex-1 space-y-6 flex flex-col h-full max-h-[700px]">
            {/* Daily Summary Header */}
            <div className="bg-muted/30 rounded-xl p-4 sm:p-5 border border-border shrink-0">
              <h3 className="text-lg font-bold font-serif text-foreground mb-4">
                Schedule for <span className="text-primary">{format(selectedDate, 'EEEE, d MMM yyyy')}</span>
              </h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-background rounded-lg p-3 border border-border shadow-sm flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-blue-600">{daySummary.dispatches}</span>
                  <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">Dispatches</span>
                </div>
                <div className="bg-background rounded-lg p-3 border border-border shadow-sm flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-amber-600">{daySummary.returns}</span>
                  <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">Returns</span>
                </div>
                <div className="bg-background rounded-lg p-3 border border-border shadow-sm flex flex-col items-center justify-center text-center">
                  <span className="text-lg sm:text-xl font-bold text-orange-600">₹{(daySummary.paymentsDue / 1000).toFixed(1)}k</span>
                  <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">Payments Due</span>
                </div>
              </div>
            </div>
            
            {/* Event List */}
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar pb-6">
              {selectedDateEvents.length === 0 ? (
                <div className="text-center py-20 bg-background/50 rounded-xl border border-dashed border-border flex flex-col items-center justify-center h-full">
                  <CalendarIcon className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-medium">No activities found for this date.</p>
                </div>
              ) : (
                selectedDateEvents.map(bill => {
                  const paid = bill.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
                  const balance = bill.totalCost - paid - (bill.discount || 0);
                  const info = getBillDisplayInfo(bill);
                  const isOverdue = bill.expectedReturnDate && bill.expectedReturnDate < format(new Date(), 'yyyy-MM-dd') && info.status !== 'Settled';
                  
                  return (
                    <div 
                      key={bill.id} 
                      onClick={() => setSelectedBill(bill)}
                      className="group p-5 rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer relative overflow-hidden"
                    >
                      {/* Left color border accent */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                        isOverdue ? 'bg-red-500' :
                        info.status === 'Upcoming' ? 'bg-blue-500' :
                        info.status === 'Active' || info.status === 'Partially Active' ? 'bg-emerald-500' :
                        'bg-orange-500'
                      }`}></div>
                      
                      <div className="flex justify-between items-start mb-2 pl-2">
                        <div className="flex items-center gap-3">
                          <h4 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors">{bill.customerName}</h4>
                          {isOverdue && (
                            <Badge variant="destructive" className="h-5 px-2 text-[10px] uppercase tracking-wider">Overdue</Badge>
                          )}
                          {!isOverdue && (
                            <Badge variant="outline" className="h-5 px-2 text-[10px] uppercase tracking-wider border-primary/20 text-primary bg-primary/5">
                              {info.status}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-base text-foreground">₹{bill.totalCost.toLocaleString('en-IN')}</div>
                          {balance > 0 && (
                            <div className="text-xs text-orange-500 font-medium mt-0.5">Due: ₹{balance.toLocaleString('en-IN')}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground flex items-center gap-4 pl-2">
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {bill.eventDate ? format(new Date(bill.eventDate), 'd MMM') : 'N/A'} - {bill.expectedReturnDate ? format(new Date(bill.expectedReturnDate), 'd MMM') : 'N/A'}</span>
                        <span className="opacity-50">|</span>
                        <span>{bill.items.length} Items</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
        </div>
      </div>

      {selectedBill && (
        <BillDetailsModal 
          billId={selectedBill.id} 
          isOpen={true} 
          onClose={() => setSelectedBill(null)} 
        />
      )}
    </div>
  );
}