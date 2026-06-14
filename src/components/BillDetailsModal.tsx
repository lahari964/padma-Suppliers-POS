import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useStore } from '../store/useStore';
import { getBillDisplayInfo } from '../hooks/useBillCalculations';
import { format, differenceInDays, differenceInHours, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, CheckCircle2, Clock, MapPin, Phone, Printer, Settings, Share2, FileText, User, MessageCircle, AlertTriangle, RefreshCcw, Plus, Send, XCircle, Save, Edit3, Trash2, X, MoreHorizontal, Wallet, Tag } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/components/ui/sonner';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { PrintReceipt } from './PrintReceipt';

export function BillDetailsModal({ isOpen, onClose, billId }: { isOpen: boolean, onClose: () => void, billId: string | null }) {
  const { bills, updateBill, updateInventoryQty, inventory, currentUser, preferences } = useStore();
  const bill = bills.find(b => b.id === billId);
  
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Bank'>('Cash');
  const [discountAmount, setDiscountAmount] = useState('');
  const [promiseDate, setPromiseDate] = useState(bill?.paymentPromiseDate || '');

  // Modal States
  const [sendModalItem, setSendModalItem] = useState<any>(null);
  const [showSendAll, setShowSendAll] = useState(false);
  const [deleteModalItem, setDeleteModalItem] = useState<any>(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [returnModalItem, setReturnModalItem] = useState<any>(null);
  const [showReturnAll, setShowReturnAll] = useState(false);

  // Common Modal Inputs
  const formatToDDMMYYYY = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'dd-MM-yyyy');
    } catch(e) {
      return dateStr;
    }
  };

  const [modalDate, setModalDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [modalTime, setModalTime] = useState(format(new Date(), 'HH:mm'));
  const [modalQty, setModalQty] = useState<number | ''>('');
  
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesTemp, setNotesTemp] = useState('');
  
  const [isEditingTransport, setIsEditingTransport] = useState(false);
  const [transportTemp, setTransportTemp] = useState('');

  const [isEditingPromiseDate, setIsEditingPromiseDate] = useState(false);
  const [promiseDateTemp, setPromiseDateTemp] = useState('');

  const handleSavePromiseDate = () => {
    updateBill(bill.id, { paymentPromiseDate: promiseDateTemp || undefined });
    setIsEditingPromiseDate(false);
    toast.success('Payment promise date updated');
  };

  const handleSaveTransport = () => {
    const newTransport = Number(transportTemp) || 0;
    const oldTransport = bill.transportationCharges || 0;
    const diff = newTransport - oldTransport;
    
    if (diff !== 0) {
      const newTotalCost = bill.totalCost + diff;
      
      let newStatus = bill.status;
      const newRemaining = newTotalCost - totalPaid - (bill.discount || 0);
      const allReturned = bill.items.every(i => (i.qtyReturned || 0) >= i.qtyIssued);
      if (newRemaining <= 0 && allReturned) {
         newStatus = 'Settled';
      } else if (newRemaining > 0 && allReturned && bill.status === 'Settled') {
         newStatus = 'Pending';
      }

      const newAuditLog = {
        timestamp: Date.now(),
        action: 'Updated Transport',
        employeeName: currentUser?.name || 'System',
        details: `Changed from ₹${oldTransport} to ₹${newTransport}`
      };

      updateBill(bill.id, { 
        transportationCharges: newTransport,
        totalCost: newTotalCost,
        status: newStatus,
        auditTrail: [...(bill.auditTrail || []), newAuditLog]
      });
      toast.success('Transportation charges updated');
    }
    setIsEditingTransport(false);
  };
  
  const [showAddItems, setShowAddItems] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addQty, setAddQty] = useState<Record<string, number>>({});
  const [addPrice, setAddPrice] = useState<Record<string, number>>({});
  
  const [showStartBilling, setShowStartBilling] = useState(false);
  const [billingStartDate, setBillingStartDate] = useState(bill?.eventDate || format(new Date(), 'yyyy-MM-dd'));
  const [billingStartTime, setBillingStartTime] = useState(bill?.eventTime || format(new Date(), 'HH:mm'));
  
  const [showPreBillingReturn, setShowPreBillingReturn] = useState(false);

  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const getItemDates = (item: any) => {
    let dates = [];
    if (item.dispatchDate) {
      try { dates.push(`Sent: ${formatToDDMMYYYY(item.dispatchDate)} ${item.dispatchTime || ''}`); } catch(e){}
    }
    const itemReturns = bill?.returnHistory?.filter(r => r.items.some(i => i.name === item.name));
    if (itemReturns && itemReturns.length > 0) {
      const lastReturn = itemReturns[itemReturns.length - 1];
      try { dates.push(`Ret: ${formatToDDMMYYYY(lastReturn.date)} ${lastReturn.time || ''}`); } catch(e){}
    }
    return dates;
  };
  
  // Damages tracking
  const [hasDamages, setHasDamages] = useState(false);
  const [modalDamageQty, setModalDamageQty] = useState<number | ''>('');
  const [modalDamageCost, setModalDamageCost] = useState<number | ''>('');
  
  if (!bill) return null;

  const totalPaid = bill.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
  const remainingBalance = bill.totalCost - totalPaid - (bill.discount || 0);

  // Define clear rules for when an item should appear in the "To Dispatch" vs "Active" tables
  const isItemConsideredDispatched = (i: any) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return i.isDispatched === true || (!('isDispatched' in i) && i.issueDate <= todayStr) || (bill.billingStarted && !i.isAddedPostBilling);
  };

  const isItemPendingDispatch = (i: any) => {
    return !isItemConsideredDispatched(i);
  };

  const displayStatus = getBillDisplayInfo(bill).status;

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleApplyDiscount = () => {
    if (!discountAmount || Number(discountAmount) <= 0) return;
    const newDiscount = (bill.discount || 0) + Number(discountAmount);
    
    const newRemaining = bill.totalCost - totalPaid - newDiscount;
    
    let newStatus = bill.status;
    const allReturned = bill.items.every(i => (i.qtyReturned || 0) >= i.qtyIssued);
    if (newRemaining <= 0 && allReturned) {
      newStatus = 'Settled';
    }
    
    const newAuditLog = {
      timestamp: Date.now(),
      action: 'Discount Applied',
      employeeName: currentUser?.name || 'System',
      details: `Amount: ₹${Number(discountAmount)}`
    };

    updateBill(bill.id, { 
      discount: newDiscount,
      status: newStatus,
      auditTrail: [...(bill.auditTrail || []), newAuditLog]
    });
    setDiscountAmount('');
    setShowDiscountModal(false);
    toast.success('Discount applied');
  };

  const handleRecordPayment = () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) return;
    const newPayments = [...(bill.payments || []), {
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: Number(paymentAmount),
      handledBy: currentUser?.name
    }];
    
    const newTotalPaid = totalPaid + Number(paymentAmount);
    const newRemaining = bill.totalCost - newTotalPaid - (bill.discount || 0);
    
    let newStatus = bill.status;
    const allReturned = bill.items.every(i => (i.qtyReturned || 0) >= i.qtyIssued);
    if (newRemaining <= 0 && allReturned) {
      newStatus = 'Settled';
    }
    
    const newAuditLog = {
      timestamp: Date.now(),
      action: 'Payment Added',
      employeeName: currentUser?.name || 'System',
      details: `Amount: ₹${paymentAmount}. New Status: ${newStatus}`
    };

    updateBill(bill.id, { 
      payments: newPayments, 
      status: newStatus,
      auditTrail: [...(bill.auditTrail || []), newAuditLog]
    });
    setPaymentAmount('');
    setShowPaymentModal(false);
    toast.success('Payment recorded successfully');
  };

  const openSendModal = (item: any) => {
    setSendModalItem(item);
    setModalDate(format(new Date(), 'yyyy-MM-dd'));
    setModalTime(format(new Date(), 'HH:mm'));
    setModalQty(item.qtyIssued);
  };

  const confirmSendItem = () => {
    const qty = Number(modalQty);
    if (!qty || qty <= 0) {
      toast.error('Please enter a valid quantity to send.');
      return;
    }

    const item = sendModalItem;
    if (!item) return;

    let updatedItems = [...bill.items];
    const sDate = modalDate;
    const sTime = modalTime;

    if (qty >= item.qtyIssued) {
      updatedItems = updatedItems.map(i => i.id === item.id ? { ...i, isDispatched: true, dispatchDate: sDate, dispatchTime: sTime, issueDate: sDate, issueTime: sTime } : i);
    } else {
      const sentItem = { ...item, id: `ITM-${Date.now()}-${Math.random()}`, qtyIssued: qty, isDispatched: true, dispatchDate: sDate, dispatchTime: sTime, issueDate: sDate, issueTime: sTime };
      const remainingItem = { ...item, qtyIssued: item.qtyIssued - qty };
      updatedItems = updatedItems.map(i => i.id === item.id ? remainingItem : i);
      updatedItems.push(sentItem);
    }

    const newAuditLog = {
      timestamp: Date.now(),
      action: 'Item Dispatched',
      employeeName: currentUser?.name || 'System',
      details: `Dispatched ${qty}x ${item.name}.`
    };

    updateBill(bill.id, { 
      items: updatedItems,
      auditTrail: [...(bill.auditTrail || []), newAuditLog]
    });

    setSendModalItem(null);
    toast.success('Item dispatched successfully!');
  };

  const openSendAllModal = () => {
    setShowSendAll(true);
    setModalDate(format(new Date(), 'yyyy-MM-dd'));
    setModalTime(format(new Date(), 'HH:mm'));
  };

  const confirmSendAll = () => {
    const upcomingItems = bill.items.filter(i => !i.isDispatched);
    if (upcomingItems.length === 0) return;

    const sDate = modalDate;
    const sTime = modalTime;

    const updatedItems = bill.items.map(i => {
      if (!i.isDispatched) {
        return { ...i, isDispatched: true, dispatchDate: sDate, dispatchTime: sTime };
      }
      return i;
    });

    const newAuditLog = {
      timestamp: Date.now(),
      action: 'Dispatched All Items',
      employeeName: currentUser?.name || 'System',
      details: `Bulk dispatched ${upcomingItems.length} items.`
    };

    updateBill(bill.id, { 
      items: updatedItems,
      auditTrail: [...(bill.auditTrail || []), newAuditLog]
    });

    setShowSendAll(false);
    toast.success('All upcoming items dispatched successfully!');
  };

  const openDeleteModal = (item: any) => {
    setDeleteModalItem(item);
    setModalQty(item.qtyIssued);
  };

  const confirmDeleteItemQty = () => {
    const qtyToRemove = Number(modalQty);
    if (!qtyToRemove || qtyToRemove <= 0) return;

    const item = deleteModalItem;
    if (!item) return;

    let updatedItems = [...bill.items];
    
    // Restore inventory stock
    updateInventoryQty(item.inventoryId, qtyToRemove);
    
    if (qtyToRemove >= item.qtyIssued) {
      updatedItems = updatedItems.filter(i => i.id !== item.id);
    } else {
      updatedItems = updatedItems.map(i => i.id === item.id ? { ...i, qtyIssued: i.qtyIssued - qtyToRemove } : i);
    }

    const newTotalCost = bill.totalCost - (qtyToRemove * item.price * 1);

    const newAuditLog = {
      timestamp: Date.now(),
      action: 'Item Removed',
      employeeName: currentUser?.name || 'System',
      details: `Removed ${qtyToRemove}x ${item.name}.`
    };

    updateBill(bill.id, { 
      items: updatedItems,
      totalCost: newTotalCost,
      auditTrail: [...(bill.auditTrail || []), newAuditLog]
    });
    
    setDeleteModalItem(null);
    toast.success('Item quantity removed successfully');
  };

  const confirmDeleteAllUpcoming = () => {
    let updatedItems = [...bill.items];
    let removedCost = 0;
    
    const upcomingItems = bill.items.filter(i => !i.isDispatched);
    
    upcomingItems.forEach(item => {
      updateInventoryQty(item.inventoryId, item.qtyIssued);
      removedCost += (item.qtyIssued * item.price * 1);
    });

    updatedItems = updatedItems.filter(i => i.isDispatched);

    const newTotalCost = bill.totalCost - removedCost;

    const newAuditLog = {
      timestamp: Date.now(),
      action: 'Bulk Items Removed',
      employeeName: currentUser?.name || 'System',
      details: `Removed all upcoming items (${upcomingItems.length}).`
    };

    updateBill(bill.id, { 
      items: updatedItems,
      totalCost: newTotalCost,
      auditTrail: [...(bill.auditTrail || []), newAuditLog]
    });
    
    setShowDeleteAll(false);
    toast.success('All upcoming items removed successfully');
  };

  const handleAddNewItems = () => {
    let updatedItems = [...bill.items];
    let newCost = bill.totalCost;
    
    const itemsToAdd = inventory.filter(i => addQty[i.id] && addQty[i.id] > 0);
    if (itemsToAdd.length === 0) {
      toast.error("Select at least one item to add");
      return;
    }
    
    itemsToAdd.forEach(invItem => {
      const qty = addQty[invItem.id];
      const finalPrice = addPrice[invItem.id] ?? invItem.price;
      const newItem = {
        id: `ITM-${Date.now()}-${Math.random()}`,
        inventoryId: invItem.id,
        name: invItem.name,
        price: finalPrice,
        issueDate: bill.eventDate || format(new Date(), 'yyyy-MM-dd'),
        issueTime: bill.eventTime || format(new Date(), 'HH:mm'),
        issueTimestamp: Date.now(),
        qtyIssued: qty,
        qtyReturned: 0,
        days: 1,
        isDispatched: false,
        isAddedPostBilling: displayStatus !== 'Upcoming',
        handledBy: currentUser?.name
      };
      
      updatedItems.push(newItem);
      newCost += finalPrice * qty * 1; // base 1 day cost
      
      // Deduct stock
      updateInventoryQty(invItem.id, -qty);
    });
    
    const newAuditLog = {
      timestamp: Date.now(),
      action: 'Added Items to Bill',
      employeeName: currentUser?.name || 'System',
      details: `Added ${itemsToAdd.length} new item types to order.`
    };
    
    updateBill(bill.id, {
      items: updatedItems,
      totalCost: newCost,
      status: 'Partially Active',
      auditTrail: [...(bill.auditTrail || []), newAuditLog]
    });
    
    setAddQty({});
    setShowAddItems(false);
    toast.success('New items added successfully!');
  };

  const handleSendReminder = () => {
    const text = `Hi ${bill.customerName},\n\nJust a quick reminder for your upcoming event on ${bill.eventDate}. You have a pending balance of ₹${Math.max(0, bill.totalCost - (bill.payments?.reduce((acc, p) => acc + p.amount, 0) || 0) - (bill.discount || 0))}. Please prepare for the dispatch.\n\nThank you,\nPadma POS`;
    const safeMobile = bill.mobile.replace(/\D/g, '');
    window.open(`https://wa.me/91${safeMobile}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareReceipt = () => {
    let text = `*Rental Receipt - Padma Suppliers*\n`;
    text += `Customer: ${bill.customerName}\n`;
    text += `Event Date: ${bill.eventDate}\n\n`;
    
    const activeItems = bill.items.filter(i => i.isDispatched);
    if (activeItems.length > 0) {
      text += `*Dispatched Items:*\n`;
      activeItems.forEach(i => {
         const pending = i.qtyIssued - (i.qtyReturned || 0);
         text += `- ${i.name}: ${i.qtyIssued} sent`;
         if (i.qtyReturned > 0) text += ` (${i.qtyReturned} returned)`;
         text += `\n`;
      });
      text += `\n`;
    }
    
    const paid = bill.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
    const balance = Math.max(0, bill.totalCost - paid - (bill.discount || 0));
    
    text += `Total Cost: ₹${bill.totalCost}\n`;
    text += `Amount Paid: ₹${paid}\n`;
    if (bill.discount) text += `Discount: ₹${bill.discount}\n`;
    text += `*Pending Balance: ₹${balance}*\n\n`;
    
    if (bill.status === 'Pending') {
       text += `Please settle the pending balance at your earliest convenience.\n`;
       if (bill.paymentPromiseDate) {
          text += `(Promised Payment Date: ${format(parseISO(bill.paymentPromiseDate), 'dd-MM-yyyy')})\n\n`;
       }
    }
    
    text += `Thank you for choosing Padma Suppliers!`;
    
    const safeMobile = bill.mobile.replace(/\D/g, '');
    window.open(`https://wa.me/91${safeMobile}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const openReturnAllModal = () => {
    setShowReturnAll(true);
    setModalDate(format(new Date(), 'yyyy-MM-dd'));
    setModalTime(format(new Date(), 'HH:mm'));
  };

  const handleStartBilling = () => {
    let updatedItems = [...bill.items];
    updatedItems = updatedItems.map(i => ({ ...i, issueDate: billingStartDate, issueTime: billingStartTime, isDispatched: true, dispatchDate: billingStartDate, dispatchTime: billingStartTime }));
    
    const newAuditLog = {
      timestamp: Date.now(),
      action: 'Billing Started',
      employeeName: currentUser?.name || 'System',
      details: `Billing officially started on ${billingStartDate} at ${billingStartTime}`
    };

    updateBill(bill.id, {
      billingStarted: true,
      status: 'Active',
      items: updatedItems,
      auditTrail: [...(bill.auditTrail || []), newAuditLog]
    });
    setShowStartBilling(false);
    toast.success('Billing has officially started!');
  };

  const confirmReturn = (forceZeroDays: boolean = false, bulkReturn: boolean = false) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    let extraCost = 0;
    let damageChargesTotal = 0;
    const damageDetailsList: any[] = [];
    
    const itemsToReturn = bill.items.filter(i => {
      if (bulkReturn) return (i.qtyIssued - (i.qtyReturned || 0)) > 0;
      if (returnModalItem && i.id === returnModalItem.id) return true;
      return false;
    });

    if (itemsToReturn.length === 0 || (!bulkReturn && (!modalQty || Number(modalQty) <= 0))) {
      toast.error('Please enter a valid quantity to return.');
      return;
    }

    const itemsReturnedList: any[] = [];

    const updatedItems = bill.items.map(i => {
      const isTarget = bulkReturn ? ((i.qtyIssued - (i.qtyReturned || 0)) > 0) : (returnModalItem && i.id === returnModalItem.id);
      if (!isTarget) return i;
      
      const pending = i.qtyIssued - (i.qtyReturned || 0);
      const qtyToReturn = bulkReturn ? pending : Number(modalQty);
      if (qtyToReturn <= 0) return i;

      const dQty = (!bulkReturn && hasDamages) ? Number(modalDamageQty || 0) : 0;
      const dCostPerUnit = (!bulkReturn && hasDamages) ? Number(modalDamageCost || 0) : 0;
      
      const rDate = modalDate || todayStr;
      const rTime = modalTime || format(new Date(), 'HH:mm');
      
      let days = 0;
      if (!forceZeroDays) {
        if (rDate >= i.issueDate) {
          const issueDateTime = new Date(`${i.issueDate}T${i.issueTime || '10:00'}:00`);
          const returnDateTime = new Date(`${rDate}T${rTime}:00`);
          const hours = Math.max(0, differenceInHours(returnDateTime, issueDateTime));
          days = Math.max(1, Math.floor(hours / 24)); 
        }
      }
      
      extraCost += (qtyToReturn * i.price * days) - (qtyToReturn * i.price * 1);
      itemsReturnedList.push({ name: i.name, qty: qtyToReturn, days, cost: qtyToReturn * i.price * days, time: rTime });
      
      if (dQty > 0 && dQty <= qtyToReturn) {
         const dTotal = dQty * dCostPerUnit;
         damageChargesTotal += dTotal;
         damageDetailsList.push({
           itemId: i.id,
           name: i.name,
           qty: dQty,
           chargePerUnit: dCostPerUnit,
           totalCharge: dTotal
         });
      }
      
      const goodReturns = Math.max(0, qtyToReturn - dQty);
      if (goodReturns > 0) {
        updateInventoryQty(i.inventoryId, goodReturns);
      }
      
      return { ...i, qtyReturned: (i.qtyReturned || 0) + qtyToReturn };
    });

    if (!forceZeroDays) {
      for (const i of itemsToReturn) {
        if (modalDate < i.issueDate) {
          toast.error(`Cannot return ${i.name} before billing start date (${i.issueDate})`);
          return;
        }
      }
    }

    if (itemsReturnedList.length === 0) return;

    const returnLog = {
      date: modalDate || todayStr,
      time: modalTime || format(new Date(), 'HH:mm'),
      items: itemsReturnedList,
      handledBy: currentUser?.name
    };

    const newTotalCost = bill.totalCost + extraCost + damageChargesTotal;
    const newRemaining = newTotalCost - totalPaid - (bill.discount || 0);
    const allReturned = updatedItems.every(i => (i.qtyReturned || 0) >= i.qtyIssued);
    
    let newStatus = bill.status;
    if (allReturned) {
      if (hasDamages && damageDetailsList.length > 0) {
        newStatus = 'Returned with Damages';
      } else {
        newStatus = newRemaining > 0 ? 'Pending' : 'Settled';
      }
    } else {
      newStatus = 'Partially Active';
    }

    const newAuditLog = {
      timestamp: Date.now(),
      action: forceZeroDays ? 'Return (No Billing)' : (allReturned ? 'Full Return' : 'Item Returned'),
      employeeName: currentUser?.name || 'System',
      details: `Returned ${itemsReturnedList.reduce((acc, curr) => acc + curr.qty, 0)}x items. Status: ${newStatus}`
    };

    const updatedBillPayload: any = { 
      items: updatedItems,
      returnHistory: [...(bill.returnHistory || []), returnLog],
      status: newStatus as any,
      totalCost: newTotalCost,
      auditTrail: [...(bill.auditTrail || []), newAuditLog]
    };
    
    if (damageDetailsList.length > 0) {
       updatedBillPayload.damageCharges = (bill.damageCharges || 0) + damageChargesTotal;
       updatedBillPayload.damageDetails = [...(bill.damageDetails || []), ...damageDetailsList];
    }

    updateBill(bill.id, updatedBillPayload);

    setReturnModalItem(null);
    setShowReturnAll(false);
    setShowPreBillingReturn(false);
    toast.success('Return processed successfully');
  };

  const handleReturnAction = (bulkReturn: boolean) => {
    if (!bill.billingStarted && (bill.status === 'Upcoming' || bill.status === 'Partially Active')) {
      setShowPreBillingReturn(true);
      return;
    }
    confirmReturn(false, bulkReturn);
  };

  const openReturnModal = (item: any) => {
    setReturnModalItem(item);
    setModalDate(format(new Date(), 'yyyy-MM-dd'));
    setModalTime(format(new Date(), 'HH:mm'));
    setModalQty(item.qtyIssued - (item.qtyReturned || 0));
    setModalDamageQty('');
    setModalDamageCost('');
  };

  const handleSaveNotes = () => {
    updateBill(bill.id, { notes: notesTemp });
    setIsEditingNotes(false);
  };

  // Timeline Data Compilation
  const totalIssued = bill.items.reduce((acc, item) => acc + item.qtyIssued, 0);
  const createdDateStr = bill.eventDate || format(new Date(parseInt(bill.id.split('-')[1])), 'dd-MM-yyyy');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-background/95 backdrop-blur-sm border-border/50 print:static print:translate-x-0 print:translate-y-0 print:w-full print:h-auto print:max-w-none print:border-none print:bg-white print:overflow-visible print:shadow-none print:p-0 print:m-0">
        
        <PrintReceipt bill={bill} />

        {/* Sticky Header */}
        <div className="flex justify-between items-start lg:items-center px-4 lg:px-6 py-4 border-b border-border bg-card z-10 print:hidden gap-2">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="flex flex-col lg:flex-row lg:items-center text-xl lg:text-2xl font-bold font-serif tracking-tight text-foreground leading-tight">
              <span>Customer Insights:</span>
              <span className="text-primary lg:ml-2">{bill.customerName}</span>
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full shrink-0 bg-muted/50 hover:bg-destructive hover:text-destructive-foreground transition-colors mt-0.5 lg:mt-0">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 custom-scrollbar print:hidden">
          
          {/* Bento Grid: Customer Insights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-card p-6 rounded-2xl border border-border shadow-sm">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Mobile</p>
              <a href={`tel:${bill.mobile}`} className="font-semibold text-primary hover:underline block">{bill.mobile}</a>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Referral</p>
              <p className="font-semibold text-foreground">{bill.referral || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={
                  displayStatus === 'Settled' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                  displayStatus === 'Pending' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                  displayStatus === 'Upcoming' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                  displayStatus === 'Returned with Damages' ? 'bg-red-500/10 text-red-600 border-red-500/30 font-bold' :
                  'bg-amber-500/10 text-amber-500 border-amber-500/20'
                }>{displayStatus}</Badge>
              </div>
            </div>
            {(() => {
              const todayStr = format(new Date(), 'yyyy-MM-dd');
              const isPureUpcoming = displayStatus === 'Upcoming';
              const isUpcomingEvent = bill.eventDate && bill.eventDate > todayStr;
              const isEventArrived = bill.eventDate && bill.eventDate <= todayStr;
              const isSentEarly = (displayStatus === 'Active' || displayStatus === 'Partially Active') && isUpcomingEvent;
              
              const showStartBillingBanner = !bill.billingStarted && (
                (isPureUpcoming && isEventArrived) || isSentEarly
              );

              if (!showStartBillingBanner) return null;

              return (
                <div className="col-span-2 md:col-span-4 mt-2">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-blue-700 dark:text-blue-400">Billing Has Not Started</h4>
                      <p className="text-xs text-blue-600/80 dark:text-blue-300/80 mt-0.5">Start billing to move this order to Active and officially begin the rental clock.</p>
                    </div>
                    <Button onClick={() => setShowStartBilling(true)} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-sm font-bold w-full sm:w-auto">
                      Start Billing Now
                    </Button>
                  </div>
                </div>
              );
            })()}
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Event Date</p>
              <p className="font-semibold text-foreground">{bill.eventDate ? formatToDDMMYYYY(bill.eventDate) : <span className="text-muted-foreground italic text-sm">Not set</span>}</p>
            </div>
            
            {/* Payment Promise Date */}
            <div className="space-y-1 group relative rounded-xl p-2 -m-2 hover:bg-muted/30 transition-all">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Calendar className="w-2.5 h-2.5 text-orange-500" />
                  </div>
                  Promise Date
                </p>
                {!isEditingPromiseDate && displayStatus === 'Pending' && (
                  <button onClick={() => { setPromiseDateTemp(bill.paymentPromiseDate || ''); setIsEditingPromiseDate(true); }} className="bg-background border border-border/60 shadow-sm p-1.5 text-muted-foreground hover:text-primary hover:border-primary/30 rounded-md absolute right-2 top-2">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              
              {isEditingPromiseDate ? (
                <div className="flex items-center gap-1.5 mt-2 animate-in fade-in slide-in-from-top-1">
                  <Input 
                    type="date" 
                    value={promiseDateTemp} 
                    onChange={e => setPromiseDateTemp(e.target.value)} 
                    className="h-8 text-sm font-medium border-primary/40 focus-visible:ring-primary/20 bg-background" 
                    autoFocus
                  />
                  <Button size="sm" onClick={handleSavePromiseDate} className="h-8 w-8 p-0 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shrink-0"><CheckCircle2 className="w-4 h-4" /></Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditingPromiseDate(false)} className="h-8 w-8 p-0 rounded-md text-muted-foreground hover:text-destructive shrink-0"><X className="w-4 h-4" /></Button>
                </div>
              ) : (
                <p className="font-semibold text-foreground text-lg tracking-tight mt-1">
                  {bill.paymentPromiseDate ? formatToDDMMYYYY(bill.paymentPromiseDate) : <span className="text-muted-foreground italic text-sm">Not set</span>}
                </p>
              )}
            </div>
            
            {/* Transportation with inline edit */}
            <div className="space-y-1 group relative rounded-xl p-2 -m-2 hover:bg-muted/30 transition-all">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <MapPin className="w-2.5 h-2.5 text-blue-500" />
                  </div>
                  Transport
                </p>
                {!isEditingTransport && (
                  <button onClick={() => { setTransportTemp(String(bill.transportationCharges || 0)); setIsEditingTransport(true); }} className="bg-background border border-border/60 shadow-sm p-1.5 text-muted-foreground hover:text-primary hover:border-primary/30 rounded-md absolute right-2 top-2">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              
              {isEditingTransport ? (
                <div className="flex items-center gap-1.5 mt-2 animate-in fade-in slide-in-from-top-1">
                  <div className="relative w-full">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                    <Input 
                      type="number" 
                      value={transportTemp} 
                      onChange={e => setTransportTemp(e.target.value)} 
                      onFocus={e => e.target.select()}
                      className="h-8 pl-6 pr-2 text-sm font-medium border-primary/40 focus-visible:ring-primary/20 bg-background" 
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && handleSaveTransport()}
                    />
                  </div>
                  <Button size="sm" onClick={handleSaveTransport} className="h-8 w-8 p-0 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shrink-0"><CheckCircle2 className="w-4 h-4" /></Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditingTransport(false)} className="h-8 w-8 p-0 rounded-md text-muted-foreground hover:text-destructive shrink-0"><X className="w-4 h-4" /></Button>
                </div>
              ) : (
                <p className="font-semibold text-foreground text-lg tracking-tight mt-1">₹{(bill.transportationCharges || 0).toLocaleString('en-IN')}</p>
              )}
            </div>

            <div className="space-y-1 p-2 -m-2">
              <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
              <p className="font-semibold text-foreground text-lg tracking-tight mt-1">₹{bill.totalCost.toLocaleString('en-IN')}</p>
            </div>
            <div className="space-y-1 p-2 -m-2">
              <p className="text-sm font-medium text-muted-foreground">Balance</p>
              <p className={`font-semibold text-lg tracking-tight mt-1 ${remainingBalance > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>
                ₹{Math.max(0, remainingBalance).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="space-y-1 col-span-2">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-muted-foreground">Created by: <span className="font-semibold text-foreground">{bill.createdBy || 'System'}</span></p>
                {!isEditingNotes ? (
                  <Button variant="outline" size="sm" onClick={() => { setNotesTemp(bill.notes || ''); setIsEditingNotes(true); }} className="rounded-full h-8 text-xs">
                    <Edit3 className="w-3 h-3 mr-2" /> View / Edit Notes
                  </Button>
                ) : null}
              </div>
              {isEditingNotes && (
                <div className="mt-3 flex gap-2 animate-in slide-in-from-top-2">
                  <Input value={notesTemp} onChange={e => setNotesTemp(e.target.value)} placeholder="Add notes..." className="h-8 text-sm" />
                  <Button size="sm" onClick={handleSaveNotes} className="h-8 rounded-lg"><Save className="w-3 h-3 mr-1" /> Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingNotes(false)} className="h-8">Cancel</Button>
                </div>
              )}
              {!isEditingNotes && bill.notes && (
                <p className="text-sm italic text-muted-foreground mt-2 border-l-2 border-primary/30 pl-3 py-1 bg-muted/20 rounded-r-md">{bill.notes}</p>
              )}
            </div>
          </div>

          {/* Items To Be Dispatched (Upcoming) */}
          {bill.items.some(isItemPendingDispatch) && displayStatus !== 'Settled' && (
            <div className="space-y-4">
              {/* Desktop Header */}
              <div className="hidden lg:flex justify-between items-center border-b border-border pb-2 mt-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-bold font-serif text-foreground">Items To Dispatch</h3>
                  <Button size="sm" variant="outline" onClick={() => setShowAddItems(true)} className="h-8 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200">
                    + Add New Items to Order
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowDeleteAll(true)} className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10">Delete All</Button>
                  <Button size="sm" onClick={openSendAllModal} className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold">Send All</Button>
                </div>
              </div>

              {/* Mobile Header Stack */}
              <div className="flex lg:hidden flex-col gap-3 border-b border-border pb-3 mt-6">
                <h3 className="text-xl font-bold font-serif text-foreground">Items To Dispatch</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowAddItems(true)} className="flex-1 h-9 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200">
                    + Add New Items
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowDeleteAll(true)} className="flex-1 h-9 text-destructive border-destructive/30 hover:bg-destructive/10">
                    Delete All
                  </Button>
                </div>
                <Button size="sm" onClick={openSendAllModal} className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm">
                  Send All Items
                </Button>
              </div>
              <div className="hidden md:block bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[30%]">Item</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Booked</TableHead>
                      <TableHead className="text-center">Dispatched</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bill.items.filter(isItemPendingDispatch).map(item => {
                      const dispatchedQty = bill.items.filter(i => i.inventoryId === item.inventoryId && isItemConsideredDispatched(i)).reduce((acc, curr) => acc + curr.qtyIssued, 0);
                      const totalBooked = item.qtyIssued + dispatchedQty;
                      return (
                      <TableRow key={item.id} className="group">
                        <TableCell>
                          <p className="font-semibold text-foreground">{item.name}</p>
                          {getItemDates(item).map((d, i) => (
                            <p key={i} className="text-[10px] text-muted-foreground mt-0.5">{d}</p>
                          ))}
                          <p className="text-xs text-muted-foreground mt-0.5">Rate: ₹{item.price}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Upcoming</Badge>
                        </TableCell>
                        <TableCell className="text-center font-medium">{totalBooked}</TableCell>
                        <TableCell className="text-center font-medium text-blue-600">{dispatchedQty}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" onClick={() => openSendModal(item)} className="h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4">Send</Button>
                            <Button variant="outline" size="sm" onClick={() => openDeleteModal(item)} className="h-9 px-3 text-destructive border-destructive/30 hover:bg-destructive/10">Edit / Delete</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards (Items To Dispatch) */}
              <div className="block md:hidden space-y-3">
                {bill.items.filter(isItemPendingDispatch).map(item => {
                  const dispatchedQty = bill.items.filter(i => i.inventoryId === item.inventoryId && isItemConsideredDispatched(i)).reduce((acc, curr) => acc + curr.qtyIssued, 0);
                  const totalBooked = item.qtyIssued + dispatchedQty;
                  return (
                    <div key={item.id} className="bg-card border border-border rounded-xl p-3 flex flex-col gap-3 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Rate: ₹{item.price}</p>
                        </div>
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 shrink-0">Upcoming</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm font-medium bg-muted/30 p-2 rounded-lg">
                        <div className="flex-1 text-center">Booked: {totalBooked}</div>
                        <div className="w-px h-4 bg-border"></div>
                        <div className="flex-1 text-center text-blue-600">Sent: {dispatchedQty}</div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-border mt-1">
                        <Button size="sm" onClick={() => openSendModal(item)} className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold">Send</Button>
                        <Button variant="outline" size="sm" onClick={() => openDeleteModal(item)} className="flex-1 h-9 text-destructive border-destructive/30 hover:bg-destructive/10">Edit / Delete</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Current Items Status (Active / Partially Active) */}
          {bill.items.some(isItemConsideredDispatched) && displayStatus !== 'Upcoming' && displayStatus !== 'Pending' && displayStatus !== 'Settled' && (
            <div className="space-y-4">
              {/* Desktop Header */}
              <div className="hidden lg:flex justify-between items-center border-b border-border pb-2 mt-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-bold font-serif text-foreground">Active / Dispatched Items Status</h3>
                  {displayStatus !== 'Settled' && (
                    <Button size="sm" variant="outline" onClick={() => setShowAddItems(true)} className="h-8 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200">
                      + Add New Items to Order
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <input type="checkbox" checked={hasDamages} onChange={e => setHasDamages(e.target.checked)} className="accent-red-500 w-4 h-4" />
                    Report Damages
                  </label>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={openReturnAllModal} className="h-8 border-primary/30 text-primary hover:bg-primary/10">Return All Remaining</Button>
                  </div>
                </div>
              </div>

              {/* Mobile Header Stack */}
              <div className="flex lg:hidden flex-col gap-3 border-b border-border pb-3 mt-6">
                <h3 className="text-xl font-bold font-serif text-foreground leading-tight">Active / Dispatched Items Status</h3>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <input type="checkbox" checked={hasDamages} onChange={e => setHasDamages(e.target.checked)} className="accent-red-500 w-4 h-4" />
                    Report Damages
                  </label>
                </div>
                <div className="flex gap-2">
                  {displayStatus !== 'Settled' && (
                    <Button size="sm" variant="outline" onClick={() => setShowAddItems(true)} className="flex-1 h-9 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200">
                      + Add New Items
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={openReturnAllModal} className="flex-1 h-9 border-primary/30 text-primary hover:bg-primary/10">
                    Return All
                  </Button>
                </div>
              </div>
              <div className="hidden md:block bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[25%]">Item</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Issued</TableHead>
                      <TableHead className="text-center">Ret</TableHead>
                      <TableHead className="text-center">Pending</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bill.items.filter(isItemConsideredDispatched).map(item => {
                      const pendingReturn = item.qtyIssued - (item.qtyReturned || 0);
                      return (
                        <TableRow key={item.id} className="group">
                          <TableCell>
                            <p className="font-semibold text-foreground">{item.name}</p>
                            {getItemDates(item).map((d, i) => (
                              <p key={i} className="text-[10px] text-muted-foreground mt-0.5">{d}</p>
                            ))}
                            <p className="text-xs text-muted-foreground mt-0.5">Rate: ₹{item.price}</p>
                          </TableCell>
                          <TableCell>
                            {pendingReturn === 0 ? (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Returned</Badge>
                            ) : (
                              <div className="space-y-1">
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Sent</Badge>
                                <p className="text-[10px] text-muted-foreground">By: {item.handledBy || bill.createdBy}</p>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-medium">{item.qtyIssued}</TableCell>
                          <TableCell className="text-center font-medium">{item.qtyReturned || 0}</TableCell>
                          <TableCell className="text-center font-medium text-orange-500">{pendingReturn}</TableCell>
                          <TableCell className="text-right">
                            {pendingReturn > 0 && (
                              <Button size="sm" onClick={() => openReturnModal(item)} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4">Return</Button>
                            )}
                            {pendingReturn === 0 && (
                              <div className="flex items-center justify-end">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards (Active Items) */}
              <div className="block md:hidden space-y-3">
                {bill.items.filter(isItemConsideredDispatched).map(item => {
                  const pendingReturn = item.qtyIssued - (item.qtyReturned || 0);
                  return (
                    <div key={item.id} className="bg-card border border-border rounded-xl p-3 flex flex-col gap-3 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Rate: ₹{item.price}</p>
                        </div>
                        {pendingReturn === 0 ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shrink-0">Returned</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 shrink-0">Sent</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm font-medium bg-muted/30 p-2 rounded-lg">
                        <div className="flex-1 text-center">Issued: {item.qtyIssued}</div>
                        <div className="w-px h-4 bg-border"></div>
                        <div className="flex-1 text-center">Ret: {item.qtyReturned || 0}</div>
                        <div className="w-px h-4 bg-border"></div>
                        <div className="flex-1 text-center text-orange-500">Pend: {pendingReturn}</div>
                      </div>
                      {pendingReturn > 0 && (
                        <div className="pt-2 border-t border-border mt-1">
                          <Button size="sm" onClick={() => openReturnModal(item)} className="w-full h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-bold">Return Items</Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Returned Items (Pending / Settled) */}
          {(displayStatus === 'Pending' || displayStatus === 'Settled') && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-2 mt-6">
                <h3 className="text-xl font-bold font-serif text-foreground">Returned Items</h3>
              </div>
              <div className="hidden md:block bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[40%]">Item</TableHead>
                      <TableHead className="text-center">Issued</TableHead>
                      <TableHead className="text-center text-emerald-600 font-bold">Returned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bill.items.filter(isItemConsideredDispatched).map(item => (
                      <TableRow key={item.id} className="group">
                        <TableCell>
                          <p className="font-semibold text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Rate: ₹{item.price}</p>
                        </TableCell>
                        <TableCell className="text-center font-medium">{item.qtyIssued}</TableCell>
                        <TableCell className="text-center font-medium text-emerald-600">{item.qtyReturned || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards (Returned Items) */}
              <div className="block md:hidden space-y-3">
                {bill.items.filter(isItemConsideredDispatched).map(item => (
                  <div key={item.id} className="bg-card border border-border rounded-xl p-3 flex flex-col gap-2 shadow-sm">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Rate: ₹{item.price}</p>
                    </div>
                    <div className="flex justify-between items-center text-sm bg-emerald-500/10 p-2 px-3 rounded-lg border border-emerald-500/20">
                      <span className="font-medium text-emerald-700/70 dark:text-emerald-400/70">Issued: {item.qtyIssued}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">Returned: {item.qtyReturned || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Return Log History */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold font-serif text-foreground border-b border-border pb-2">Return Log History</h3>
              {(!bill.returnHistory || bill.returnHistory.length === 0) ? (
                <div className="p-8 text-center border border-dashed border-border rounded-xl bg-muted/10">
                  <p className="text-muted-foreground text-sm">No items returned yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bill.returnHistory.map((log, idx) => (
                    <div key={idx} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="bg-muted/40 px-4 py-3 border-b border-border flex justify-between items-center">
                        <span className="font-semibold text-sm">Return Date: <span className="text-foreground">{log.date} {log.time ? `at ${log.time}` : ''}</span></span>
                        <Badge variant="secondary" className="font-normal text-xs bg-background">Handled by: {log.handledBy || 'System'}</Badge>
                      </div>
                      <div className="p-4 space-y-2">
                        {log.items.map((i, idx2) => (
                          <div key={idx2} className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">{i.qty}x <span className="text-foreground font-medium">{i.name}</span> <span className="text-xs opacity-70">({i.days} days)</span></span>
                            <span className="font-bold">₹{i.cost}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit Log Timeline */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold font-serif text-foreground border-b border-border pb-2">Audit Log Timeline</h3>
              <div className="relative pl-6 space-y-8 py-2">
                <div className="absolute left-2.5 top-2 bottom-2 w-px bg-border"></div>

                {bill.auditTrail?.map((log, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-background z-10"></div>
                    <p className="text-xs font-bold text-muted-foreground mb-1">{format(log.timestamp, 'dd-MM-yyyy hh:mm a')}</p>
                    <p className="font-semibold text-foreground text-base">{log.action}</p>
                    <p className="text-sm text-muted-foreground mt-1">{log.details}</p>
                    <p className="text-xs text-muted-foreground mt-1 opacity-70">By: {log.employeeName}</p>
                  </div>
                ))}
                
                {(!bill.auditTrail || bill.auditTrail.length === 0) && (
                  <div className="relative">
                     <p className="text-sm text-muted-foreground">Legacy bill - no audit trail available.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Sticky Footer */}
        <div className="bg-card border-t border-border p-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 z-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] print:hidden">
          
          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">

            <Button onClick={() => setShowPaymentModal(true)} className="h-12 px-6 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground text-base transition-all gap-2 shadow-sm shrink-0">
              <Wallet className="w-4 h-4" /> Record Payment
            </Button>
            {currentUser?.role !== 'Staff' && (
              <Button variant="outline" onClick={() => setShowDiscountModal(true)} className="h-12 px-6 rounded-xl font-bold border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 text-base transition-all gap-2 shrink-0">
                <Tag className="w-4 h-4" /> Discount / Waive
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button 
              className="flex-1 sm:flex-none h-12 px-6 rounded-xl font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white transition-all gap-2 shadow-sm shrink-0"
              onClick={handleShareReceipt}
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 sm:flex-none h-12 px-6 rounded-xl font-bold bg-background hover:bg-muted border-border hover:border-primary/50 transition-all gap-2 shrink-0"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </div>


        {/* Discount Modal */}
        <Dialog open={showDiscountModal} onOpenChange={setShowDiscountModal}>
          <DialogContent className="max-w-md bg-card border-border">
            <h3 className="text-xl font-bold font-serif mb-2">Discount / Waive Amount</h3>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Discount Amount (₹)</Label>
                <Input type="number" placeholder="Enter amount to discount..." value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} className="h-12 text-lg" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <Button variant="ghost" onClick={() => setShowDiscountModal(false)}>Cancel</Button>
              <Button onClick={handleApplyDiscount} className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white">Apply Discount</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Payment Modal */}
        <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <DialogContent className="max-w-md bg-card border-border">
            <h3 className="text-xl font-bold font-serif mb-2">Record Payment</h3>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Payment Amount (₹)</Label>
                <Input type="number" placeholder="Enter amount received..." value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="h-12 text-lg" />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(val: any) => setPaymentMethod(val)}>
                  <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <Button variant="ghost" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
              <Button onClick={handleRecordPayment} className="font-bold">Save Payment</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Send Modal */}
        <Dialog open={!!sendModalItem} onOpenChange={() => setSendModalItem(null)}>
          <DialogContent className="max-w-md bg-card border-border">
            <h3 className="text-xl font-bold font-serif mb-2">Send Item: {sendModalItem?.name}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dispatch Date</Label>
                  <DatePicker value={modalDate} onChange={setModalDate} className="w-full" />
                </div>
                <div className="space-y-2">
                  <Label>Dispatch Time</Label>
                  <TimePicker value={modalTime} onChange={setModalTime} className="w-full" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Quantity to Send</Label>
                <Input type="number" min="1" max={sendModalItem?.qtyIssued} value={modalQty} onChange={e => setModalQty(e.target.value ? parseInt(e.target.value) : '')} className="w-full" />
              </div>
              <Button onClick={confirmSendItem} className="w-full bg-blue-600 hover:bg-blue-700 font-bold mt-4">Confirm Send</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Send All Modal */}
        <Dialog open={showSendAll} onOpenChange={setShowSendAll}>
          <DialogContent className="max-w-md bg-card border-border">
            <h3 className="text-xl font-bold font-serif mb-2">Send All Upcoming Items</h3>
            <p className="text-sm text-muted-foreground mb-4">Set the dispatch date and time for all remaining upcoming items.</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dispatch Date</Label>
                  <DatePicker value={modalDate} onChange={setModalDate} className="w-full" />
                </div>
                <div className="space-y-2">
                  <Label>Dispatch Time</Label>
                  <TimePicker value={modalTime} onChange={setModalTime} className="w-full" />
                </div>
              </div>
              <Button onClick={confirmSendAll} className="w-full bg-blue-600 hover:bg-blue-700 font-bold mt-4">Confirm Send All</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Modal */}
        <Dialog open={!!deleteModalItem} onOpenChange={() => setDeleteModalItem(null)}>
          <DialogContent className="max-w-md bg-card border-border">
            <h3 className="text-xl font-bold font-serif mb-2 text-destructive">Edit/Delete: {deleteModalItem?.name}</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Quantity to Delete</Label>
                <Input type="number" min="1" max={deleteModalItem?.qtyIssued} value={modalQty} onChange={e => setModalQty(e.target.value ? parseInt(e.target.value) : '')} className="w-full" />
                <p className="text-xs text-muted-foreground">Select the quantity you wish to cancel/delete from the order.</p>
              </div>
              <Button variant="destructive" onClick={confirmDeleteItemQty} className="w-full font-bold mt-4">Confirm Delete Quantity</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete All Modal */}
        <Dialog open={showDeleteAll} onOpenChange={setShowDeleteAll}>
          <DialogContent className="max-w-md bg-card border-border">
            <h3 className="text-xl font-bold font-serif mb-2 text-destructive">Delete All Upcoming Items</h3>
            <p className="text-sm text-muted-foreground mb-4">Are you sure you want to cancel and remove all items that haven't been dispatched yet?</p>
            <div className="space-y-4">
              <Button variant="destructive" onClick={confirmDeleteAllUpcoming} className="w-full font-bold mt-4">Yes, Delete All Upcoming</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Return Modal */}
        <Dialog open={!!returnModalItem} onOpenChange={() => setReturnModalItem(null)}>
          <DialogContent className="max-w-md bg-card border-border">
            <h3 className="text-xl font-bold font-serif mb-2">Return Item: {returnModalItem?.name}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Return Date</Label>
                  <DatePicker value={modalDate} onChange={setModalDate} className="w-full" />
                </div>
                <div className="space-y-2">
                  <Label>Return Time</Label>
                  <TimePicker value={modalTime} onChange={setModalTime} className="w-full" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Quantity to Return</Label>
                <Input type="number" min="1" max={returnModalItem ? (returnModalItem.qtyIssued - (returnModalItem.qtyReturned || 0)) : 0} value={modalQty} onChange={e => setModalQty(e.target.value ? parseInt(e.target.value) : '')} className="w-full" />
              </div>
              {hasDamages && (
                <div className="bg-red-500/5 border border-red-500/20 p-3 rounded-lg space-y-3 mt-2">
                  <Label className="text-sm font-bold text-red-500 uppercase">Damaged Items Included</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label className="text-xs">Damaged Qty</Label>
                       <Input type="number" min="0" max={Number(modalQty) || 0} value={modalDamageQty} onChange={e => setModalDamageQty(e.target.value ? parseInt(e.target.value) : '')} className="w-full border-red-500/30 text-red-600" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-xs">Charge Per Unit (₹)</Label>
                       <Input type="number" min="0" value={modalDamageCost} onChange={e => setModalDamageCost(e.target.value ? parseInt(e.target.value) : '')} className="w-full border-red-500/30 text-red-600" />
                    </div>
                  </div>
                </div>
              )}
              <Button onClick={() => handleReturnAction(false)} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold mt-4">Confirm Return</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Return All Modal */}
        <Dialog open={showReturnAll} onOpenChange={setShowReturnAll}>
          <DialogContent className="max-w-md bg-card border-border">
            <h3 className="text-xl font-bold font-serif mb-2">Return All Pending Items</h3>
            <p className="text-sm text-muted-foreground mb-4">Set the return date and time for all pending items.</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Return Date</Label>
                  <DatePicker value={modalDate} onChange={setModalDate} className="w-full" />
                </div>
                <div className="space-y-2">
                  <Label>Return Time</Label>
                  <TimePicker value={modalTime} onChange={setModalTime} className="w-full" />
                </div>
              </div>
              {hasDamages && (
                <div className="bg-red-500/5 border border-red-500/20 p-3 rounded-lg mt-2">
                   <p className="text-xs text-red-500 font-medium">To report damages for specific items, please return them individually instead of using Return All.</p>
                </div>
              )}
              <Button onClick={() => handleReturnAction(true)} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold mt-4">Confirm Return All</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Items Dialog */}
        <Dialog open={showAddItems} onOpenChange={setShowAddItems}>
          <DialogContent className="max-w-2xl bg-card border-border max-h-[80vh] flex flex-col">
            <h3 className="text-xl font-bold font-serif">Add New Items to Order</h3>
            <Input 
              placeholder="Search inventory..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mt-2"
            />
            <div className="flex-1 overflow-y-auto mt-4 space-y-2 pr-2 custom-scrollbar">
               {inventory.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.category.toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
                 <div key={item.id} className="flex justify-between items-center p-3 border border-border rounded-lg">
                   <div>
                     <p className="font-medium text-sm">{item.name}</p>
                     <p className="text-xs text-muted-foreground">Available: {item.qtyAvailable || 0}</p>
                   </div>
                   <div className="flex items-center gap-4">
                     <div className="flex flex-col items-center gap-1">
                       <span className="text-[10px] text-muted-foreground uppercase font-semibold">Rate</span>
                       <div className="flex items-center">
                         <span className="text-muted-foreground text-sm mr-1">₹</span>
                         <Input 
                            type="number" 
                            min="0"
                            placeholder={item.price.toString()}
                            value={addPrice[item.id] !== undefined ? addPrice[item.id] : item.price}
                            onChange={(e) => setAddPrice(prev => ({ ...prev, [item.id]: e.target.value ? parseFloat(e.target.value) : 0 }))}
                            className="w-16 h-8 text-center"
                            onFocus={(e) => e.target.select()}
                         />
                       </div>
                     </div>
                     <div className="flex flex-col items-center gap-1">
                       <span className="text-[10px] text-muted-foreground uppercase font-semibold">Qty</span>
                       <Input 
                          type="number" 
                          min="0"
                        max={item.qtyAvailable || 1000}
                        placeholder="0"
                        value={addQty[item.id] || ''}
                        onChange={(e) => setAddQty(prev => ({ ...prev, [item.id]: parseInt(e.target.value) || undefined as any }))}
                        className="w-16 h-8 text-center"
                     />
                     </div>
                   </div>
                 </div>
               ))}
               {inventory.length === 0 && <p className="text-sm text-muted-foreground text-center">No inventory found.</p>}
            </div>
            <div className="mt-4 pt-4 border-t border-border flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAddItems(false)}>Cancel</Button>
              <Button onClick={handleAddNewItems} className="bg-primary hover:bg-primary/90 text-primary-foreground">Add to Order</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Start Billing Dialog */}
        <Dialog open={showStartBilling} onOpenChange={setShowStartBilling}>
          <DialogContent className="max-w-md bg-card border-border">
            <h3 className="text-xl font-bold font-serif mb-2">Start Billing</h3>
            <p className="text-sm text-muted-foreground mb-4">When did the event officially start? The rental duration (and cost) will be calculated from this exact date and time.</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Billing Start Date</Label>
                <DatePicker value={billingStartDate} onChange={setBillingStartDate} className="w-full" />
              </div>
              <div className="space-y-2">
                <Label>Billing Start Time</Label>
                <TimePicker value={billingStartTime} onChange={setBillingStartTime} className="w-full" />
              </div>
              <Button onClick={handleStartBilling} className="w-full bg-blue-600 hover:bg-blue-700 font-bold mt-4">Confirm & Start Billing</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Pre-Billing Return Dialog */}
        <Dialog open={showPreBillingReturn} onOpenChange={setShowPreBillingReturn}>
          <DialogContent className="max-w-md bg-card border-border">
            <h3 className="text-xl font-bold font-serif mb-2">Billing Hasn't Started</h3>
            <p className="text-sm text-muted-foreground mb-4">You are trying to process a return, but the billing clock for this order was never started. How would you like to calculate this return?</p>
            <div className="space-y-3">
              <Button onClick={() => { setShowPreBillingReturn(false); setShowStartBilling(true); }} className="w-full bg-blue-600 hover:bg-blue-700 font-bold">
                Start Billing Now
              </Button>
              <Button variant="outline" onClick={() => confirmReturn(true)} className="w-full border-border hover:bg-muted font-bold">
                Confirm Return (No Billing)
              </Button>
              <Button variant="ghost" onClick={() => setShowPreBillingReturn(false)} className="w-full text-muted-foreground">Cancel</Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
