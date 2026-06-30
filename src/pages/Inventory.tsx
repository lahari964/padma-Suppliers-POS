import { useState, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useStore } from '../store/useStore';
import { InventoryItem } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Trash2, Edit, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function Inventory() {
  const inventory = useStore(state => state.inventory);
  const setInventory = useStore(state => state.setInventory);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  
  const parentRef = useRef<HTMLDivElement>(null);

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const virtualizer = useVirtualizer({
    count: filteredInventory.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 65,
    overscan: 5,
  });
  const items = virtualizer.getVirtualItems();

  const handleOpenDialog = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setName(item.name);
      setPrice(item.price.toString());
      setCategory(item.category);
    } else {
      setEditingItem(null);
      setName('');
      setPrice('');
      setCategory('');
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!name || !price) {
      toast.error('Please fill required fields');
      return;
    }
    
    if (editingItem) {
      const updated = inventory.map(item => 
        item.id === editingItem.id ? { ...item, name, price: Number(price), category } : item
      );
      setInventory(updated);
      toast.success('Item updated');
    } else {
      const newItem: InventoryItem = {
        id: Date.now().toString(),
        name,
        price: Number(price),
        category: category || 'Uncategorized'
      };
      setInventory([...inventory, newItem]);
      toast.success('Item added');
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setInventory(inventory.filter(item => item.id !== id));
      toast.success('Item deleted');
    }
  };

  const handleAutoCategorize = () => {
    let updatedCount = 0;
    const newInventory = inventory.map(item => {
      if (item.category && item.category !== 'Other' && item.category !== 'Uncategorized') {
        return item;
      }
      
      const name = item.name.toLowerCase();
      let newCat = item.category || 'Other';

      if (name.includes('sofa') || name.includes('table') || name.includes('chair') || name.includes('peta') || name.includes('peeta')) {
        newCat = 'Furniture & Seating';
      } else if (name.includes('tent') || name.includes('pandal') || name.includes('shamiana')) {
        newCat = 'Tents & Structures';
      } else if (name.includes('plate') || name.includes('box') || name.includes('tray') || name.includes('glass') || name.includes('spoon') || name.includes('bowl')) {
        newCat = 'Catering & Food Service';
      } else if (name.includes('gangqlam') || name.includes('gangalam') || name.includes('pooja') || name.includes('binde') || name.includes('sthnam')) {
        newCat = 'Traditional & Ritual Items';
      } else if (name.includes('water') || name.includes('drum') || name.includes('cooler') || name.includes('fan')) {
        newCat = 'Utilities & Water';
      } else if (name.includes('light') || name.includes('sound') || name.includes('dj') || name.includes('mike') || name.includes('mic')) {
        newCat = 'Lighting & Audio';
      }

      if (newCat !== item.category) {
        updatedCount++;
        return { ...item, category: newCat };
      }
      return item;
    });

    if (updatedCount > 0) {
      setInventory(newInventory);
      toast.success(`Auto-categorized ${updatedCount} items successfully!`);
    } else {
      toast.info('All items are already categorized or no matching keywords found.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold font-serif">Inventory Management</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleAutoCategorize} 
            className="gap-2 border-purple-200 text-purple-700 bg-purple-50/50 hover:bg-purple-100 hover:text-purple-800 hover:border-purple-300 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-900/50 dark:hover:text-purple-200 dark:bg-purple-950/30"
          >
            <Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-400" /> Auto-Categorize
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search items..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
      <div ref={parentRef} className="bg-card border border-border rounded-xl shadow-sm overflow-auto max-h-[600px]">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead className="hidden sm:table-cell">Category</TableHead>
              <TableHead className="text-right">Price (₹)</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No items found.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {items.length > 0 && <TableRow style={{ height: `${items[0].start}px` }} />}
                {items.map((virtualRow) => {
                  const item = filteredInventory[virtualRow.index];
                  return (
                    <TableRow key={item.id} className="group h-[65px]">
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {item.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{item.price.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 sm:gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(item)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {items.length > 0 && <TableRow style={{ height: `${virtualizer.getTotalSize() - items[items.length - 1].end}px` }} />}
              </>
            )}
          </TableBody>
        </Table>
      </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Maharaja Sofa" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Input list="category-suggestions" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Furniture & Seating" />
              <datalist id="category-suggestions">
                <option value="Furniture & Seating" />
                <option value="Catering & Food Service" />
                <option value="Tents & Structures" />
                <option value="Traditional & Ritual Items" />
                <option value="Utilities & Water" />
                <option value="Lighting & Audio" />
              </datalist>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Price / Day (₹)</label>
              <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
