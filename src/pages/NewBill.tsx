import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Bill, StagedItem, InventoryItem, CustomService } from '../types';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Search, Trash2, Armchair, Box, Fan, Lightbulb, Package, ArrowLeft, FileText, Check } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const getCategoryIcon = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'furniture': return <Armchair className="w-4 h-4" />;
    case 'decor & linens': return <Box className="w-4 h-4" />;
    case 'cooling & heating': return <Fan className="w-4 h-4" />;
    case 'lighting & electrical': return <Lightbulb className="w-4 h-4" />;
    default: return <Package className="w-4 h-4" />;
  }
};

export default function NewBill() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isQuotation = searchParams.get('type') === 'quotation';
  const { inventory, updateInventoryQty, addBill, currentUser, preferences } = useStore();
  const compactView = preferences?.compactView;

  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [eventDate, setEventDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [eventTime, setEventTime] = useState(format(new Date(), 'HH:mm'));
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [transportation, setTransportation] = useState('');
  const [advance, setAdvance] = useState('');
  const [discount, setDiscount] = useState('');
  const [referral, setReferral] = useState('');
  const [notes, setNotes] = useState('');
  const [customServices, setCustomServices] = useState<CustomService[]>([]);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  
  const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [inventoryQty, setInventoryQty] = useState<Record<string, number | string>>({});
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});
  const [draftLoaded, setDraftLoaded] = useState(false);

  useEffect(() => {
    const draft = localStorage.getItem('sadma_newbill_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.customerName) setCustomerName(parsed.customerName);
        if (parsed.mobile) setMobile(parsed.mobile);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.eventDate) setEventDate(parsed.eventDate);
        if (parsed.eventTime) setEventTime(parsed.eventTime);
        if (parsed.expectedReturnDate) setExpectedReturnDate(parsed.expectedReturnDate);
        if (parsed.transportation) setTransportation(parsed.transportation);
        if (parsed.advance) setAdvance(parsed.advance);
        if (parsed.discount) setDiscount(parsed.discount);
        if (parsed.referral) setReferral(parsed.referral);
        if (parsed.notes) setNotes(parsed.notes);
        if (parsed.stagedItems) setStagedItems(parsed.stagedItems);
        if (parsed.stagedItems?.length > 0 || parsed.customerName) {
          toast.success('Draft restored automatically.');
        }
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
    setDraftLoaded(true);
  }, []);

  useEffect(() => {
    if (!draftLoaded) return;
    const draft = { customerName, mobile, address, eventDate, eventTime, expectedReturnDate, transportation, advance, discount, referral, notes, stagedItems };
    if (customerName || mobile || stagedItems.length > 0) {
      localStorage.setItem('sadma_newbill_draft', JSON.stringify(draft));
    } else {
      localStorage.removeItem('sadma_newbill_draft');
    }
  }, [customerName, mobile, address, eventDate, eventTime, expectedReturnDate, transportation, advance, discount, referral, notes, stagedItems, draftLoaded]);

  const groupedInventory = useMemo(() => {
    const filtered = inventory.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return filtered.reduce((acc, item) => {
      const cat = item.category || 'Other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, InventoryItem[]>);
  }, [inventory, searchQuery]);

  const handleAddItem = (item: InventoryItem, qty: number = 1) => {
    setStagedItems(prev => {
      const existing = prev.find(i => i.inventoryId === item.id);
      if (existing) {
        return prev.map(i => i.inventoryId === item.id ? { ...i, qty: i.qty + qty } : i);
      }
      return [...prev, {
        inventoryId: item.id,
        name: item.name,
        price: item.price,
        qty: qty
      }];
    });
    // Vibrate lightly on supported mobile devices
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
    toast.success(`${qty}x ${item.name} added`, { 
      duration: 1500, 
      position: window.innerWidth < 768 ? 'top-center' : 'bottom-right' 
    });
  };

  const updateItemQty = (inventoryId: string, newQty: number) => {
    if (newQty <= 0) {
      setStagedItems(prev => prev.filter(i => i.inventoryId !== inventoryId));
      return;
    }
    setStagedItems(prev => prev.map(i => i.inventoryId === inventoryId ? { ...i, qty: newQty } : i));
  };

  const updateItemPrice = (inventoryId: string, newPrice: number) => {
    if (newPrice < 0) return;
    setStagedItems(prev => prev.map(i => i.inventoryId === inventoryId ? { ...i, price: newPrice } : i));
  };

  const removeStagedItem = (inventoryId: string) => {
    setStagedItems(prev => prev.filter(i => i.inventoryId !== inventoryId));
  };

  const calculateTotal = () => {
    const subtotal = stagedItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const servicesTotal = customServices.reduce((acc, service) => acc + service.price, 0);
    return subtotal + servicesTotal + (Number(transportation) || 0) - (Number(discount) || 0);
  };

  const handleSaveBill = () => {
    if (stagedItems.length === 0 && customServices.length === 0) {
      window.alert('Please add at least one Item or Custom Service to create a bill');
      return;
    }
    if (!customerName) {
      toast.error('Customer name is required');
      return;
    }
    if (!mobile || mobile.length !== 10) {
      toast.error('Mobile number must be exactly 10 digits');
      return;
    }

    const totalCost = calculateTotal();
    
    let initialStatus: Bill['status'] = 'Upcoming';
    if (!isQuotation && eventDate <= format(new Date(), 'yyyy-MM-dd')) {
      initialStatus = 'Active';
      if (!address) {
        toast.error('Warning: Immediate dispatch requires a Customer Address.');
        return;
      }
    }

    const newBill: Bill = {
      id: `BLL-${Date.now()}`,
      customerName,
      mobile,
      address,
      referral,
      advance: Number(advance) || 0,
      discount: Number(discount) || 0,
      status: initialStatus,
      totalCost,
      eventDate,
      eventTime,
      expectedReturnDate,
      transportationCharges: Number(transportation) || 0,
      notes,
      isQuotation,
      items: stagedItems.map(item => ({
        id: `ITM-${Date.now()}-${Math.random()}`,
        inventoryId: item.inventoryId,
        name: item.name,
        price: item.price,
        originalPrice: inventory.find(i => i.id === item.inventoryId)?.price || item.price,
        issueDate: eventDate,
        issueTime: eventTime || format(new Date(), 'HH:mm'),
        issueTimestamp: Date.now(),
        qtyIssued: item.qty,
        qtyReturned: 0,
        days: 1,
        isDispatched: initialStatus === 'Active',
        dispatchDate: initialStatus === 'Active' ? format(new Date(), 'yyyy-MM-dd') : undefined,
        dispatchTime: initialStatus === 'Active' ? format(new Date(), 'HH:mm') : undefined,
        handledBy: currentUser?.name || 'System'
      })),
      returnHistory: [],
      payments: Number(advance) > 0 ? [{
        date: format(new Date(), 'yyyy-MM-dd'),
        amount: Number(advance),
        handledBy: currentUser?.name
      }] : [],
      createdBy: currentUser?.name,
      customServices: customServices,
      auditTrail: [{
        timestamp: Date.now(),
        action: isQuotation ? 'Quotation Created' : 'Bill Created',
        employeeName: currentUser?.name || 'System',
        details: isQuotation ? 'Initial quotation generated.' : `Status: ${initialStatus}, Items: ${stagedItems.length}, Services: ${customServices.length}, Total: ₹${totalCost}`
      }]
    };

    if (!isQuotation) {
      stagedItems.forEach(item => {
        updateInventoryQty(item.inventoryId, -item.qty);
      });
    }

    addBill(newBill);
    toast.loading('Saving and syncing to cloud...', { id: 'create-bill' });
    localStorage.removeItem('sadma_newbill_draft');
    
    import('../lib/supabase').then(async ({ syncUpToCloud }) => {
      const { success, error } = await syncUpToCloud();
      toast.dismiss('create-bill');
      
      if (success) {
        toast.success(isQuotation ? 'Quotation created successfully!' : 'Bill created and synced successfully!');
      } else {
        toast.success('Bill saved locally. Sync failed: ' + (error || 'Unknown network error'));
      }
      navigate('/bills');
    });
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 animate-in fade-in duration-300">
      <div className="flex-1 flex flex-col bg-card rounded-2xl border border-border overflow-hidden h-fit max-h-full">
        <div className="p-6 pb-4 bg-muted/50 border-b border-border flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/bills')} className="h-8 w-8 rounded-full">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Button>
          <h2 className="text-2xl font-bold text-foreground">{isQuotation ? 'Create Quotation / Estimate' : 'New Rental Bill'}</h2>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">Customer Name *</Label>
              <Input className="bg-background border-border h-11 rounded-xl" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Rajesh Kumar" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">Mobile Number *</Label>
              <Input 
                type="tel"
                className="bg-background border-border h-11 rounded-xl" 
                value={mobile} 
                onChange={e => {
                  let val = e.target.value.replace(/\D/g, '');
                  if (val.startsWith('91') && val.length > 10) val = val.substring(2);
                  if (val.startsWith('0') && val.length > 10) val = val.substring(1);
                  setMobile(val.substring(0, 10));
                }} 
                placeholder="e.g. 9876543210" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">Customer Address</Label>
              <Input className="bg-background border-border h-11 rounded-xl" value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. Ongole, Andhra Pradesh" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">Event / Outward Date</Label>
              <DatePicker className="h-11 rounded-xl" value={eventDate} onChange={(date) => setEventDate(date)} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">Event Time</Label>
              <TimePicker className="bg-background border-border h-11 rounded-xl w-32" value={eventTime} onChange={setEventTime} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">Transportation (₹)</Label>
              <Input type="number" className="bg-background border-border h-11 rounded-xl" value={transportation} onChange={e => setTransportation(e.target.value)} placeholder="0" />
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full bg-card rounded-xl border border-border px-4">
            <AccordionItem value="optional-details" className="border-none">
              <AccordionTrigger className="text-[15px] font-semibold hover:no-underline py-4">
                Add Optional Details (Advance, Expected Return, Referral, Notes...)
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Advance Paid (₹)</Label>
                    <Input type="number" className="bg-background border-border h-11 rounded-xl" value={advance} onChange={e => setAdvance(e.target.value)} placeholder="0" disabled={isQuotation} />
                    {isQuotation && <p className="text-[10px] text-muted-foreground mt-1">Quotations do not process advance payments.</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Discount (₹)</Label>
                    <Input type="number" className="bg-background border-border h-11 rounded-xl" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Expected Return</Label>
                    <DatePicker className="h-11 rounded-xl" value={expectedReturnDate} onChange={(date) => setExpectedReturnDate(date)} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-sm font-semibold">Referral</Label>
                    <Input className="bg-background border-border h-11 rounded-xl" value={referral} onChange={e => setReferral(e.target.value)} placeholder="e.g. Friend, Event Manager" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-sm font-semibold">Notes / Special Instructions</Label>
                    <Input className="bg-background border-border h-11 rounded-xl" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Deliver to side gate" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <p className="text-xs italic text-muted-foreground">* If Event Date is in the future, order will be saved as an "Upcoming Order".</p>

          <div className={`md:hidden ${compactView ? "space-y-1.5" : "space-y-3"}`}>
            {stagedItems.length === 0 ? (
              <div className={`bg-card border border-border rounded-2xl ${compactView ? "p-4" : "p-6"} text-center text-muted-foreground text-sm`}>
                No equipment added
              </div>
            ) : (
              stagedItems.map((item) => (
                <div key={item.inventoryId} className={`bg-card border border-border rounded-2xl ${compactView ? "p-2.5 sm:p-3" : "p-3 sm:p-4"} shadow-sm flex flex-col ${compactView ? "gap-2" : "gap-3"}`}>
                  <div className={`flex items-start justify-between gap-2 border-b border-border/50 ${compactView ? "pb-1.5" : "pb-2"}`}>
                    <span className={`font-semibold text-foreground ${compactView ? "text-xs pt-0.5" : "text-sm pt-1"} leading-tight`}>{item.name}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeStagedItem(item.inventoryId)} className={`${compactView ? "w-6 h-6" : "w-7 h-7"} text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0`} title="Remove Item">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className={`grid grid-cols-2 ${compactView ? "gap-2" : "gap-3 sm:gap-4"}`}>
                    <div>
                      <label className={`text-[10px] text-muted-foreground uppercase tracking-wide font-medium block ${compactView ? "mb-0.5" : "mb-1 sm:text-xs"}`}>Daily Rate</label>
                      <div className="flex items-center relative">
                        <span className={`text-muted-foreground ${compactView ? "text-xs left-2.5" : "text-sm left-3"} font-medium absolute`}>₹</span>
                        <Input 
                          type="number" 
                          min="0" 
                          className={`${compactView ? "h-7 text-xs pl-6" : "h-9 pl-7"} w-full font-medium bg-background`} 
                          value={item.price} 
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => updateItemPrice(item.inventoryId, Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={`text-[10px] text-muted-foreground uppercase tracking-wide font-medium block ${compactView ? "mb-0.5" : "mb-1 sm:text-xs"}`}>Quantity</label>
                      <Input 
                        type="number" 
                        min="1" 
                        className={`${compactView ? "h-7 text-xs" : "h-9"} w-full font-medium text-center bg-background`} 
                        value={item.qty} 
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => updateItemQty(item.inventoryId, Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-bold">Item</TableHead>
                  <TableHead className="text-center font-bold w-32">Daily Rate</TableHead>
                  <TableHead className="text-center font-bold w-32">Qty</TableHead>
                  <TableHead className="text-center font-bold w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stagedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className={`text-center text-muted-foreground ${compactView ? "h-16" : "h-24"}`}>No equipment added</TableCell>
                  </TableRow>
                ) : (
                  stagedItems.map((item) => (
                    <TableRow key={item.inventoryId}>
                      <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-muted-foreground">₹</span>
                          <Input 
                            type="number" 
                            min="0" 
                            className={`${compactView ? "h-7 text-xs" : "h-8"} w-20 text-center bg-background`} 
                            value={item.price} 
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => updateItemPrice(item.inventoryId, Number(e.target.value))}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          min="1" 
                          className={`${compactView ? "h-7 text-xs" : "h-8"} w-16 text-center mx-auto bg-background`} 
                          value={item.qty} 
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => updateItemQty(item.inventoryId, Number(e.target.value))}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => removeStagedItem(item.inventoryId)} className={`${compactView ? "w-7 h-7" : "w-8 h-8"} text-destructive hover:text-destructive hover:bg-destructive/10`} title="Remove Item">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Custom Services Section */}
          <div className="mt-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-500" />
                Services & Decorations
              </h3>
              <Button 
                variant="outline"
                size="sm" 
                onClick={() => setIsServiceModalOpen(true)} 
                className="w-full sm:w-auto gap-2 border-purple-200 text-purple-700 bg-purple-50/50 hover:bg-purple-100 hover:text-purple-800 hover:border-purple-300 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-900/50 dark:hover:text-purple-200 dark:bg-purple-950/30 font-semibold"
              >
                <Plus className="w-4 h-4 text-purple-500 dark:text-purple-400" /> Add Custom Service
              </Button>
            </div>
            {customServices.length > 0 && (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <Table>
                  <TableBody>
                    {customServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell className="w-32 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-muted-foreground">₹</span>
                            <Input 
                              type="number" 
                              min="0" 
                              className={`${compactView ? "h-7 text-xs" : "h-8"} w-20 text-right bg-background`} 
                              value={service.price} 
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => setCustomServices(prev => prev.map(s => s.id === service.id ? { ...s, price: Number(e.target.value) } : s))}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="w-16 text-center">
                          <Button variant="ghost" size="icon" onClick={() => setCustomServices(prev => prev.filter(s => s.id !== service.id))} className={`${compactView ? "w-7 h-7" : "w-8 h-8"} text-destructive hover:text-destructive hover:bg-destructive/10`} title="Remove Service">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-5 border-t border-border bg-muted/50 flex flex-col items-end gap-3 justify-between sm:flex-row sm:items-center">
          <div className="space-y-1">
            <p className="text-xl font-bold text-foreground">Total: ₹ {calculateTotal()}</p>
          </div>
          <Button onClick={handleSaveBill} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-8 py-6 text-base shadow-sm border-none w-full sm:w-auto">
            {isQuotation ? 'Create Quotation' : 'Create Rental Bill'}
          </Button>
        </div>
      </div>

      <div className="w-full md:w-[400px] flex flex-col h-full max-h-[calc(100vh-6rem)] overflow-hidden space-y-4">
        <div className="flex items-center justify-between shrink-0">
          <h2 className="text-2xl font-bold">Inventory</h2>
          <div className="relative w-48">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              className="pl-9 h-9 rounded-full bg-card" 
              placeholder="Search inventory..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
          {Object.entries(groupedInventory).map(([category, items]) => (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2 text-primary font-semibold px-1">
                {getCategoryIcon(category)}
                <h3>{category}</h3>
              </div>
              
              <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
                {items.map((item) => {
                  const staged = stagedItems.find(i => i.inventoryId === item.id);
                  const currentQty = staged ? staged.qty : 1;

                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          {getCategoryIcon(item.category)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{item.name}</p>
                          <p className="text-xs font-medium text-muted-foreground">₹ {item.price} <span className="opacity-70 font-normal">/day</span></p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Input 
                          type="number" 
                          min="1" 
                          className="w-20 h-8 text-center" 
                          value={inventoryQty[item.id] !== undefined ? inventoryQty[item.id] : 1}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setInventoryQty(prev => ({ ...prev, [item.id]: e.target.value }))}
                        />
                        <Button 
                          size="icon" 
                          className={`w-8 h-8 rounded-full shadow-sm border-none transition-all duration-300 ${addedItemIds[item.id] ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}
                          onClick={() => {
                            const val = inventoryQty[item.id];
                            const qty = val === "" || val === undefined ? 1 : Number(val);
                            handleAddItem(item, qty);
                            setInventoryQty(prev => ({ ...prev, [item.id]: 1 }));
                            setAddedItemIds(prev => ({ ...prev, [item.id]: true }));
                            setTimeout(() => {
                              setAddedItemIds(prev => ({ ...prev, [item.id]: false }));
                            }, 1000);
                          }}
                        >
                          {addedItemIds[item.id] ? <Check className="w-4 h-4 animate-in zoom-in duration-300" /> : <Plus className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {Object.keys(groupedInventory).length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              No inventory items found.
            </div>
          )}
        </div>
      </div>

      <Dialog open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Custom Service</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Service Name</Label>
              <Input
                placeholder="e.g. Flower Decoration"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Price (₹)</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={newServicePrice}
                onChange={(e) => setNewServicePrice(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsServiceModalOpen(false)}>Cancel</Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => {
              if (!newServiceName.trim()) {
                toast.error('Service name is required');
                return;
              }
              setCustomServices([...customServices, { id: `SRV-${Date.now()}`, name: newServiceName, price: Number(newServicePrice) || 0 }]);
              setNewServiceName('');
              setNewServicePrice('');
              setIsServiceModalOpen(false);
            }}>Add Service</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
