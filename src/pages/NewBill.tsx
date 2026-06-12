import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Bill, StagedItem, InventoryItem } from '../types';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Search, Trash2, Armchair, Box, Fan, Lightbulb, Package, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';

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
  const { inventory, updateInventoryQty, addBill, currentUser } = useStore();

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
  
  const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [inventoryQty, setInventoryQty] = useState<Record<string, number>>({});

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
  };

  const updateItemQty = (inventoryId: string, newQty: number) => {
    if (newQty <= 0) {
      setStagedItems(prev => prev.filter(i => i.inventoryId !== inventoryId));
      return;
    }
    setStagedItems(prev => prev.map(i => i.inventoryId === inventoryId ? { ...i, qty: newQty } : i));
  };

  const removeStagedItem = (inventoryId: string) => {
    setStagedItems(prev => prev.filter(i => i.inventoryId !== inventoryId));
  };

  const calculateTotal = () => {
    const subtotal = stagedItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
    return subtotal + (Number(transportation) || 0) - (Number(discount) || 0);
  };

  const handleSaveBill = () => {
    if (stagedItems.length === 0) {
      window.alert('Please SELECT THE ITEMS to create new Bill');
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
    if (eventDate <= format(new Date(), 'yyyy-MM-dd')) {
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
      items: stagedItems.map(item => ({
        id: `ITM-${Date.now()}-${Math.random()}`,
        inventoryId: item.inventoryId,
        name: item.name,
        price: item.price,
        issueDate: eventDate,
        issueTime: eventTime || format(new Date(), 'HH:mm'),
        issueTimestamp: Date.now(),
        qtyIssued: item.qty,
        qtyReturned: 0,
        days: 1,
        handledBy: currentUser?.name
      })),
      returnHistory: [],
      payments: Number(advance) > 0 ? [{
        date: format(new Date(), 'yyyy-MM-dd'),
        amount: Number(advance),
        handledBy: currentUser?.name
      }] : [],
      createdBy: currentUser?.name,
      auditTrail: [{
        timestamp: Date.now(),
        action: 'Bill Created',
        employeeName: currentUser?.name || 'System',
        details: `Status: ${initialStatus}, Items: ${stagedItems.length}, Total: ₹${totalCost}`
      }]
    };

    addBill(newBill);
    
    // Deduct stock for all items
    stagedItems.forEach(item => {
      updateInventoryQty(item.inventoryId, -item.qty);
    });

    toast.loading('Saving and syncing to cloud...', { id: 'create-bill' });
    import('../lib/supabase').then(async ({ syncUpToCloud }) => {
      const { success, error } = await syncUpToCloud();
      toast.dismiss('create-bill');
      if (success) {
        toast.success('Bill created and synced successfully!');
      } else {
        toast.success('Bill saved locally. Sync failed: ' + (error || 'Unknown network error'));
      }
      navigate('/bills');
    });
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 animate-in fade-in duration-300">
      
      {/* Left Column: Form */}
      <div className="flex-1 flex flex-col bg-card rounded-2xl border border-border overflow-hidden h-fit max-h-full">
        <div className="p-6 pb-4 bg-muted/50 border-b border-border flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/bills')} className="h-8 w-8 rounded-full">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Button>
          <h2 className="text-2xl font-bold text-foreground">New Rental Bill</h2>
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
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 10) setMobile(val);
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
                    <Input type="number" className="bg-background border-border h-11 rounded-xl" value={advance} onChange={e => setAdvance(e.target.value)} placeholder="0" />
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

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-foreground border-b border-border">
                <tr>
                  <th className="text-left font-bold py-4 px-6">Item</th>
                  <th className="text-center font-bold py-4 px-6 w-32">Daily Rate</th>
                  <th className="text-center font-bold py-4 px-6 w-32">Qty</th>
                  <th className="text-center font-bold py-4 px-4 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {stagedItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-muted-foreground">No items added yet</td>
                  </tr>
                ) : (
                  stagedItems.map((item) => (
                    <tr key={item.inventoryId} className="border-b border-emerald-50 dark:border-border last:border-0">
                      <td className="py-2 px-4">
                        <div className="font-medium text-foreground">{item.name}</div>
                      </td>
                      <td className="text-center py-2 px-4 text-muted-foreground">₹ {item.price}</td>
                      <td className="py-2 px-4">
                        <Input 
                          type="number" 
                          min="1" 
                          className="w-16 h-8 text-center mx-auto" 
                          value={item.qty} 
                          onChange={(e) => updateItemQty(item.inventoryId, Number(e.target.value))}
                        />
                      </td>
                      <td className="text-center py-2 px-2">
                        <Button variant="ghost" size="icon" onClick={() => removeStagedItem(item.inventoryId)} className="w-8 h-8 text-destructive hover:text-destructive hover:bg-destructive/10" title="Remove Item">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-border bg-muted/50 flex flex-col items-end gap-3 justify-between sm:flex-row sm:items-center">
          <div className="space-y-1">
            <p className="text-xl font-bold text-foreground">Total: ₹ {calculateTotal()}</p>
          </div>
          <Button onClick={handleSaveBill} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-8 py-6 text-base shadow-sm border-none w-full sm:w-auto">
            Create Rental Bill
          </Button>
        </div>
      </div>

      {/* Right Column: Inventory */}
      <div className="w-full md:w-[400px] flex flex-col space-y-4">
        <div className="flex items-center justify-between">
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
                          className="w-12 h-8 text-center" 
                          value={inventoryQty[item.id] || 1}
                          onChange={(e) => setInventoryQty(prev => ({ ...prev, [item.id]: parseInt(e.target.value) || 1 }))}
                        />
                        <Button 
                          size="icon" 
                          className="w-8 h-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm border-none"
                          onClick={() => {
                            const qty = inventoryQty[item.id] || 1;
                            handleAddItem(item, qty);
                            setInventoryQty(prev => ({ ...prev, [item.id]: 1 }));
                          }}
                        >
                          <Plus className="w-4 h-4" />
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
      
    </div>
  );
}
