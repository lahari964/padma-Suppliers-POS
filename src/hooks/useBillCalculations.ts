import { useMemo } from 'react';
import { format } from 'date-fns';
import { Bill } from '../types';

export const getBillDisplayInfo = (bill: Bill) => {
  if (bill.status === 'Settled' || bill.status === 'Pending') {
    return { status: bill.status, dispatchedCount: 0, upcomingCount: 0 };
  }
  
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  let dispatchedCount = 0;
  let upcomingCount = 0;
  
  bill.items.forEach(i => {
    if (i.issueDate <= todayStr) dispatchedCount += i.qtyIssued;
    else upcomingCount += i.qtyIssued;
  });
  
  let status: Bill['status'] = bill.status;
  if (dispatchedCount > 0 && upcomingCount > 0) status = 'Partially Active';
  else if (dispatchedCount > 0) status = 'Active';
  else if (upcomingCount > 0) status = 'Upcoming';
  
  return { status, dispatchedCount, upcomingCount };
};

export const useBillCalculations = (bills: Bill[]) => {
  return useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const thisMonth = format(new Date(), 'yyyy-MM');
    
    let dailyTotal = 0;
    let monthlyTotal = 0;
    let totalPending = 0;
    
    const upcomingBills: Bill[] = [];
    const activeBills: Bill[] = [];
    const pendingBills: Bill[] = [];
    const settledBills: Bill[] = [];
    
    bills.forEach(bill => {
      const info = getBillDisplayInfo(bill);
      
      if (info.status === 'Upcoming' || info.status === 'Partially Active') {
        upcomingBills.push(bill);
      }
      
      if (info.status === 'Active' || info.status === 'Partially Active') {
        activeBills.push(bill);
      }
      
      if (bill.status === 'Pending') {
        pendingBills.push(bill);
        totalPending += bill.totalCost - bill.advance - (bill.discount || 0);
      }
      
      if (bill.status === 'Settled') {
        settledBills.push(bill);
      }
      
      if (bill.payments) {
        bill.payments.forEach(p => {
          if (p.date === today) dailyTotal += p.amount;
          if (p.date.startsWith(thisMonth)) monthlyTotal += p.amount;
        });
      }
    });
    
    return {
      dailyTotal,
      monthlyTotal,
      totalPending,
      upcomingBills,
      activeBills,
      pendingBills,
      settledBills
    };
  }, [bills]);
};
