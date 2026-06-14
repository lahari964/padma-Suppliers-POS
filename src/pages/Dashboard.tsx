import { format, subMonths } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, TrendingUp, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useBillCalculations, getBillDisplayInfo } from '../hooks/useBillCalculations';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const bills = useStore(state => state.bills);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'active' | 'pending'>('upcoming');
  
  const { dailyTotal } = useBillCalculations(bills);

  const formatToDDMMYYYY = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'dd-MM-yyyy');
    } catch(e) {
      return dateStr;
    }
  };

  const today = new Date();
  const next7Days = new Date(today);
  next7Days.setDate(today.getDate() + 7);
  const todayStr = format(today, 'yyyy-MM-dd');
  const next7DaysStr = format(next7Days, 'yyyy-MM-dd');

  // Daily Metrics
  const todaysDispatches = bills.filter(b => b.eventDate === todayStr).length;
  
  let todaysReturns = 0;
  bills.forEach(b => {
    b.returnHistory?.forEach(r => {
      if (r.date === todayStr) {
        r.items.forEach(i => todaysReturns += i.qty);
      }
    });
  });

  // Calculate exact total due across all unpaid bills
  let trueTotalPending = 0;
  bills.forEach(b => {
    if (b.status !== 'Settled') {
      const paid = b.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
      trueTotalPending += Math.max(0, b.totalCost - paid - (b.discount || 0));
    }
  });

  // Next 7 Days Data
  const upcoming7DaysBills = bills.filter(b => {
    const status = getBillDisplayInfo(b).status;
    return (status === 'Upcoming' || status === 'Partially Active') && b.eventDate && b.eventDate >= todayStr && b.eventDate <= next7DaysStr;
  }).sort((a, b) => a.eventDate!.localeCompare(b.eventDate!));

  const returns7DaysBills = bills.filter(b => {
    const status = getBillDisplayInfo(b).status;
    return (status === 'Active' || status === 'Partially Active') && b.expectedReturnDate && b.expectedReturnDate >= todayStr && b.expectedReturnDate <= next7DaysStr;
  }).sort((a, b) => a.expectedReturnDate!.localeCompare(b.expectedReturnDate!));

  const payments7DaysBills = bills.filter(b => 
    b.status === 'Pending' && b.paymentPromiseDate && b.paymentPromiseDate >= todayStr && b.paymentPromiseDate <= next7DaysStr
  ).sort((a, b) => a.paymentPromiseDate!.localeCompare(b.paymentPromiseDate!));

  const overduePayments = bills.filter(b => {
    const status = getBillDisplayInfo(b).status;
    const paid = b.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
    const balance = b.totalCost - paid - (b.discount || 0);
    return balance > 0 && status === 'Pending' && b.paymentPromiseDate && b.paymentPromiseDate <= todayStr;
  });

  const overdueReturns = bills.filter(b => {
    const status = getBillDisplayInfo(b).status;
    return (status === 'Active' || status === 'Partially Active') && b.expectedReturnDate && b.expectedReturnDate < todayStr;
  });

  const pendingBillingBills = bills.filter(b => {
    return !b.billingStarted && (b.status === 'Upcoming' || b.status === 'Partially Active') && b.eventDate && b.eventDate <= todayStr;
  });

  // 6-Month Revenue Aggregation
  const revenueData = useMemo(() => {
    const data = Array.from({ length: 6 }).map((_, i) => {
      const d = subMonths(new Date(), 5 - i);
      return {
        monthStr: format(d, 'yyyy-MM'),
        label: format(d, 'MMM yy'),
        revenue: 0
      };
    });

    bills.forEach(bill => {
      bill.payments?.forEach(p => {
        const pMonth = p.date.substring(0, 7);
        const match = data.find(m => m.monthStr === pMonth);
        if (match) {
          match.revenue += p.amount;
        }
      });
    });

    return data;
  }, [bills]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold font-serif">Quick Overview</h2>
        <Button onClick={() => navigate('/bills')}>View All Bills</Button>
      </div>
      
      {/* Action Required (Priority 1) */}
      <Card className="border-destructive/20 shadow-sm">
        <CardHeader className="pb-3 border-b border-border bg-destructive/5 rounded-t-xl">
          <CardTitle className="text-destructive flex items-center gap-2 text-lg">
            <AlertTriangle className="w-5 h-5" />
            Action Required
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {overduePayments.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600 font-bold text-lg shrink-0">
                    {overduePayments.length}
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-900 dark:text-red-300">Payments Overdue</h4>
                    <p className="text-xs text-red-700/80 dark:text-red-400/80 mt-0.5">Outstanding balances on past/current events</p>
                  </div>
                </div>
                <Button 
                  className="bg-red-600 hover:bg-red-700 text-white shadow-sm whitespace-nowrap shrink-0" 
                  onClick={() => navigate('/bills?action=overdue-payments')}
                >
                  Check Payments
                </Button>
              </div>
            )}

            {overdueReturns.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 font-bold text-lg shrink-0">
                    {overdueReturns.length}
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-900 dark:text-amber-300">Orders Pending Return</h4>
                    <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5">Items not returned by their expected date</p>
                  </div>
                </div>
                <Button 
                  className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm whitespace-nowrap shrink-0" 
                  onClick={() => navigate('/bills?action=overdue-returns')}
                >
                  View Orders
                </Button>
              </div>
            )}

            {pendingBillingBills.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
                    {pendingBillingBills.length}
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-300">Pending Billing Start</h4>
                    <p className="text-xs text-blue-700/80 dark:text-blue-400/80 mt-0.5">Events starting today or in the past</p>
                  </div>
                </div>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm whitespace-nowrap shrink-0" 
                  onClick={() => navigate('/bills?action=pending-billing')}
                >
                  Start Billing
                </Button>
              </div>
            )}

            {overduePayments.length === 0 && overdueReturns.length === 0 && pendingBillingBills.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border border-dashed rounded-xl bg-muted/20">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                  <div className="w-6 h-6 text-emerald-500 font-bold text-xl">✓</div>
                </div>
                <p className="text-base font-semibold text-foreground">All caught up!</p>
                <p className="text-sm mt-1">No urgent actions required.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 4 Core Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-card hover:bg-muted/50 transition-colors border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Dispatches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysDispatches}</div>
            <p className="text-xs text-muted-foreground mt-1">Orders dispatched today</p>
          </CardContent>
        </Card>
        <Card className="bg-card hover:bg-muted/50 transition-colors border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysReturns}</div>
            <p className="text-xs text-muted-foreground mt-1">Items returned today</p>
          </CardContent>
        </Card>
        <Card className="bg-card hover:bg-muted/50 transition-colors border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{dailyTotal.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground mt-1">Payments recorded today</p>
          </CardContent>
        </Card>
        <Card className="bg-card hover:bg-muted/50 transition-colors border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Due Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">₹{trueTotalPending.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all unpaid bills</p>
          </CardContent>
        </Card>
      </div>

      {/* 6-Month Revenue Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            6-Month Historical Revenue
          </CardTitle>
          <p className="text-sm text-muted-foreground">Aggregated based on actual payment dates</p>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next 7 Days Rolling Window */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Next 7 Days Window</CardTitle>
            <CalendarDays className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 border-b border-border pb-4">
                <div 
                  className={`text-center cursor-pointer p-2 rounded-lg transition-colors ${activeTab === 'upcoming' ? 'bg-blue-500/10' : 'hover:bg-muted/50'}`}
                  onClick={() => setActiveTab('upcoming')}
                >
                  <div className="text-2xl font-bold text-blue-500">{upcoming7DaysBills.length}</div>
                  <div className="text-xs text-muted-foreground">Upcoming</div>
                </div>
                <div 
                  className={`text-center cursor-pointer p-2 rounded-lg transition-colors ${activeTab === 'active' ? 'bg-amber-500/10' : 'hover:bg-muted/50'}`} 
                  onClick={() => setActiveTab('active')}
                >
                  <div className="text-2xl font-bold text-amber-500">{returns7DaysBills.length}</div>
                  <div className="text-xs text-muted-foreground">Returns</div>
                </div>
                <div 
                  className={`text-center cursor-pointer p-2 rounded-lg transition-colors ${activeTab === 'pending' ? 'bg-orange-500/10' : 'hover:bg-muted/50'}`}
                  onClick={() => setActiveTab('pending')}
                >
                  <div className="text-2xl font-bold text-orange-500">{payments7DaysBills.length}</div>
                  <div className="text-xs text-muted-foreground">Payments</div>
                </div>
              </div>
              <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                {activeTab === 'upcoming' && upcoming7DaysBills.map(b => (
                  <div key={`up-${b.id}`} className="flex justify-between items-center bg-blue-500/5 p-3 rounded-md border border-blue-500/10 hover:bg-blue-500/10 transition-colors cursor-pointer" onClick={() => navigate('/bills')}>
                    <div>
                      <p className="font-medium text-sm">{b.customerName}</p>
                      <p className="text-xs text-muted-foreground">Upcoming on {formatToDDMMYYYY(b.eventDate!)}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-500 border-blue-500/20">{getBillDisplayInfo(b).status}</Badge>
                  </div>
                ))}
                {activeTab === 'active' && returns7DaysBills.map(b => (
                  <div key={`ret-${b.id}`} className="flex justify-between items-center bg-amber-500/5 p-3 rounded-md border border-amber-500/10 hover:bg-amber-500/10 transition-colors cursor-pointer" onClick={() => navigate('/bills')}>
                    <div>
                      <p className="font-medium text-sm">{b.customerName}</p>
                      <p className="text-xs text-muted-foreground">Return by {formatToDDMMYYYY(b.expectedReturnDate!)}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20">Return</Badge>
                  </div>
                ))}
                {activeTab === 'pending' && payments7DaysBills.map(b => {
                  const paid = b.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
                  const balance = b.totalCost - paid - (b.discount || 0);
                  return (
                    <div key={`pay-${b.id}`} className="flex justify-between items-center bg-orange-500/5 p-3 rounded-md border border-orange-500/10 hover:bg-orange-500/10 transition-colors cursor-pointer" onClick={() => navigate('/bills')}>
                      <div>
                        <p className="font-medium text-sm">{b.customerName}</p>
                        <p className="text-xs text-muted-foreground">Payment due {formatToDDMMYYYY(b.paymentPromiseDate!)}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-500 border-orange-500/20">₹{balance.toLocaleString('en-IN')}</Badge>
                    </div>
                  )
                })}
                
                {((activeTab === 'upcoming' && upcoming7DaysBills.length === 0) || 
                  (activeTab === 'active' && returns7DaysBills.length === 0) || 
                  (activeTab === 'pending' && payments7DaysBills.length === 0)) && (
                  <p className="text-sm text-muted-foreground text-center py-8">No activities for this category in the next 7 days</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
