import { playNotificationSound } from '../lib/audioSynth';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { useStore } from '../store/useStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { Trash2, Plus, UserCircle, Bell, Download, FileText, Settings as SettingsIcon, Package, Database, Sun, Moon, Activity, Wrench, Code, AlertTriangle, Key, Menu } from 'lucide-react';
import { syncUpToCloud } from '../lib/supabase';
import { getBillDisplayInfo } from '../hooks/useBillCalculations';
import { format } from 'date-fns';
import { DatePicker } from '@/components/ui/date-picker';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Copy, MoreVertical, ShieldAlert, Edit, Ban, KeyRound } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

export default function Settings() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { bills, inventory, employees, currentUser, setCurrentUser, preferences, setPreferences, isDatabaseConnected } = useStore();
  const [activeTab, setActiveTab] = useState('General');
  const [isMenuOpen, setIsMenuOpen] = useState(window.innerWidth >= 768);
  
  // Database State
  const [wipeConfirmation, setWipeConfirmation] = useState('');
  const [isWipeDialogOpen, setIsWipeDialogOpen] = useState(false);
  const { setBills, setInventory, setEmployees, setIsDatabaseConnected, updateEmployee, addEmployee } = useStore();

  const activeUser = employees.find(e => e.id === currentUser?.id) || currentUser;

  const [profileName, setProfileName] = useState(activeUser?.name || '');
  const [profileMobile, setProfileMobile] = useState(activeUser?.mobile || '');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const handleHealthCheck = async () => {
    toast.loading('Pinging database cluster...', { id: 'db-ping' });
    try {
      const { syncDownFromCloud } = await import('../lib/supabase');
      const { success, error } = await syncDownFromCloud();
      
      toast.dismiss('db-ping');
      if (!success) {
        toast.error('Connection failed: ' + (error || 'Unknown error'));
        setIsDatabaseConnected(false);
      } else {
        toast.success('Database connected and synced successfully!');
        setIsDatabaseConnected(true);
      }
    } catch (err: any) {
      toast.dismiss('db-ping');
      toast.error('Connection failed.');
      setIsDatabaseConnected(false);
    }
  };

  const repairSQL = `-- Run this in your Supabase SQL Editor
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS bills;

CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  category TEXT NOT NULL,
  "qtyAvailable" INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  role TEXT NOT NULL,
  pin TEXT NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bills (
  id TEXT PRIMARY KEY,
  "customerName" TEXT NOT NULL,
  mobile TEXT NOT NULL,
  address TEXT,
  referral TEXT,
  items JSONB NOT NULL,
  "totalCost" NUMERIC NOT NULL,
  advance NUMERIC,
  discount NUMERIC,
  status TEXT NOT NULL,
  "damageCharges" NUMERIC,
  "damageDetails" JSONB,
  "transportationCharges" NUMERIC,
  "eventDate" TEXT,
  "eventTime" TEXT,
  "expectedReturnDate" TEXT,
  "returnHistory" JSONB,
  payments JSONB,
  "paymentPromiseDate" TEXT,
  "createdBy" TEXT,
  notes TEXT,
  "billingStarted" BOOLEAN,
  "auditTrail" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: Ensure Row Level Security (RLS) is disabled for easy API access
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE bills DISABLE ROW LEVEL SECURITY;
`;

  const copySQL = () => {
    navigator.clipboard.writeText(repairSQL);
    toast.success('SQL copied to clipboard');
  };

  const handleWipeDatabase = () => {
    if (wipeConfirmation !== 'DELETE EVERYTHING') {
      toast.error('Confirmation phrase mismatch');
      return;
    }
    setBills([]);
    setInventory([]);
    setEmployees([]);
    setIsWipeDialogOpen(false);
    setWipeConfirmation('');
    toast.success('Database completely wiped');
  };
  
  
  // Staff Management State
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [staffSearchTerm, setStaffSearchTerm] = useState('');
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  
  const [newStaff, setNewStaff] = useState({ name: '', mobile: '', role: 'Staff', pin: '', status: 'Active' as const });
  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.mobile) {
      toast.error('Please fill all required fields');
      return;
    }
    if (newStaff.mobile.length !== 10) {
      toast.error('Mobile number must be exactly 10 digits');
      return;
    }
    if (employees.some(e => e.mobile === newStaff.mobile && newStaff.mobile !== '')) {
      toast.error('Mobile number already exists');
      return;
    }
    const autoPin = newStaff.mobile.slice(-4);
    addEmployee({ id: crypto.randomUUID(), ...newStaff, pin: autoPin });
    syncUpToCloud().then(res => {
      if (!res.success) toast.error('Saved locally, but failed to sync: ' + res.error);
      else toast.success(`Employee added and synced. Default PIN is ${autoPin}`);
    }).catch(console.error);
    setIsAddStaffOpen(false);
    setNewStaff({ name: '', mobile: '', role: 'Staff', pin: '', status: 'Active' });
  };

  const handleEditStaff = () => {
    if (!selectedStaff) return;
    
    if (!selectedStaff.name || !selectedStaff.mobile || !selectedStaff.pin) {
      toast.error('Please fill all required fields');
      return;
    }
    if (selectedStaff.mobile.length !== 10) {
      toast.error('Mobile number must be exactly 10 digits');
      return;
    }
    
    // Check if trying to demote/deactivate the last admin
    if (selectedStaff.role === 'Admin' || selectedStaff.status === 'Inactive') {
       const otherAdmins = employees.filter(e => e.role === 'Admin' && e.status !== 'Inactive' && e.id !== selectedStaff.id);
       if (otherAdmins.length === 0 && (selectedStaff.role !== 'Admin' || selectedStaff.status === 'Inactive')) {
         toast.error('Cannot modify the last active Admin account');
         return;
       }
    }
    
    updateEmployee(selectedStaff.id, selectedStaff);
    syncUpToCloud().then(res => {
      if (!res.success) toast.error('Saved locally, but failed to sync: ' + res.error);
      else toast.success('Employee updated successfully');
    }).catch(console.error);
    setIsEditStaffOpen(false);
  };

  const handleToggleStaffStatus = (emp: any) => {
    const newStatus = emp.status === 'Inactive' ? 'Active' : 'Inactive';
    
    // Check if trying to deactivate the last admin
    if (emp.role === 'Admin' && newStatus === 'Inactive') {
       const otherAdmins = employees.filter(e => e.role === 'Admin' && e.status !== 'Inactive' && e.id !== emp.id);
       if (otherAdmins.length === 0) {
         toast.error('Cannot deactivate the last active Admin account');
         return;
       }
    }
    
    updateEmployee(emp.id, { ...emp, status: newStatus });
    syncUpToCloud().then(res => {
      if (!res.success) toast.error('Saved locally, but failed to sync: ' + res.error);
      else toast.success(`Employee ${newStatus === 'Inactive' ? 'deactivated' : 'reactivated'} successfully`);
    }).catch(console.error);
  };


  // Export State
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  const tabs = [
    { name: 'Password', icon: KeyRound },
    ...(currentUser?.role !== 'Staff' ? [{ name: 'General', icon: SettingsIcon }] : []),
    ...(currentUser?.role === 'Admin' ? [{ name: 'Staff', icon: UserCircle }] : []),
    // Inventory tab removed
    ...(currentUser?.role !== 'Staff' ? [{ name: 'Export / Download', icon: Download }] : []),
    { name: 'Notifications', icon: Bell },
    ...(currentUser?.role === 'Admin' ? [{ name: 'Database', icon: Database }] : []),
  ];

  const handleExportFull = () => {
    if (!isDatabaseConnected) {
      toast.error('Database is not connected. Cannot export file.');
      return;
    }
    try {
      const data = { bills, inventory, employees, exportDate: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `padmapos-backup.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Full Backup Exported');
    } catch (e) {
      toast.error('Failed to export backup');
    }
  };

  const handleExportCSV = () => {
    if (!isDatabaseConnected) {
      toast.error('Database is not connected. Cannot export file.');
      return;
    }

    let dataToExport = bills;
    if (exportStartDate && exportEndDate) {
      dataToExport = bills.filter(b => {
        const inRange = b.eventDate && b.eventDate >= exportStartDate && b.eventDate <= exportEndDate;
        const paymentInRange = b.payments?.some(p => p.date >= exportStartDate && p.date <= exportEndDate);
        return inRange || paymentInRange;
      });
    } else if (exportStartDate || exportEndDate) {
      toast.error('Please select both start and end dates');
      return;
    }
    
    if (dataToExport.length === 0) {
      toast.error('No bills found for the selected criteria');
      return;
    }
    
    const headers = ['Bill ID', 'Customer Name', 'Mobile', 'Status', 'Event Date', 'Total Cost', 'Settled', 'Balance'];
    const rows = dataToExport.map(b => {
      const paid = b.payments?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
      const balance = b.totalCost - paid - (b.discount || 0);
      return [
        b.id,
        `"${b.customerName}"`,
        b.mobile,
        getBillDisplayInfo(b).status,
        b.eventDate || '',
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
    const dateRangeStr = (exportStartDate && exportEndDate) ? `${exportStartDate}_to_${exportEndDate}` : 'All';
    link.setAttribute('download', `PadmaPOS_Bills_${dateRangeStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('CSV Exported Successfully');
  };

  return (
    <div className="flex relative h-[calc(100vh-8rem)] animate-in fade-in duration-300 -m-4 md:-m-6 lg:-m-8 overflow-hidden">
      {/* Mobile Backdrop (only visible on mobile when open) */}
      {isMenuOpen && (
        <div 
          className="absolute inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidebar (Drawer on mobile, Collapsible on desktop) */}
      <div className={`
        absolute md:relative z-50 h-full bg-card md:bg-transparent
        border-r border-border p-4 shrink-0
        transition-all duration-300 ease-in-out
        ${isMenuOpen ? 'translate-x-0 w-64 shadow-2xl md:shadow-none opacity-100' : '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:p-0 md:border-r-0'}
      `}>
        <div className={`flex items-center justify-between mb-6 pb-4 border-b border-border ${!isMenuOpen && 'md:hidden'}`}>
          <h2 className="font-bold text-lg whitespace-nowrap overflow-hidden">Settings Menu</h2>
          <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
            <Menu className="w-5 h-5 shrink-0" />
          </Button>
        </div>
        <nav className={`space-y-1 ${!isMenuOpen && 'md:hidden'}`}>
          {tabs.map((t) => (
            <button
              key={t.name}
              onClick={() => {
                setActiveTab(t.name);
                if (window.innerWidth < 768) {
                  setIsMenuOpen(false);
                }
              }}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap overflow-hidden ${
                activeTab === t.name 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {t.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full min-w-0">
        {/* Menu Trigger */}
        <div className="mb-6 flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <Menu className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-bold">{activeTab} Settings</h2>
        </div>
        
                {/* --- GENERAL TAB --- */}
        {activeTab === 'General' && (
          <div className="max-w-3xl space-y-8 animate-in fade-in duration-300">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <SettingsIcon className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-bold tracking-tight">General & Receipt Settings</h3>
              </div>
              <p className="text-sm text-muted-foreground">Manage global application preferences and customize printed receipts.</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
              <h4 className="font-bold text-lg border-b pb-2 mb-4">Print Format</h4>
              <div className="space-y-3">
                <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Default Paper Size</Label>
                <Select value={preferences.receiptTemplate || 'Standard A4'} onValueChange={(v) => setPreferences({ receiptTemplate: v })}>
                  <SelectTrigger className="bg-background h-12 rounded-xl">
                    <SelectValue placeholder="Select paper size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard A4">Standard A4 (Full Page)</SelectItem>
                    <SelectItem value="Thermal 112mm">Thermal Printer (112mm - Large)</SelectItem>
                    <SelectItem value="Thermal 80mm">Thermal Printer (80mm - Standard)</SelectItem>
                    <SelectItem value="Thermal 58mm">Thermal Printer (58mm - Small)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Applies when clicking "Print Receipt" on bills.</p>
              </div>



              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold flex items-center gap-2">
                    {resolvedTheme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    Dark Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">Toggle between light and dark themes</p>
                </div>
                <Switch checked={resolvedTheme === 'dark'} onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')} className="scale-110" />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold">Compact Table View</Label>
                  <p className="text-sm text-muted-foreground">Show more rows on screen by reducing padding</p>
                </div>
                <Switch checked={preferences.compactView} onCheckedChange={(v) => setPreferences({ compactView: v })} className="scale-110" />
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
              <h4 className="font-bold text-lg border-b pb-2 mb-4">Business Details (Receipt Header)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input 
                    value={preferences.businessDetails?.name || ''} 
                    onChange={e => setPreferences({ businessDetails: { ...(preferences.businessDetails as any), name: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tagline</Label>
                  <Input 
                    value={preferences.businessDetails?.tagline || ''} 
                    onChange={e => setPreferences({ businessDetails: { ...(preferences.businessDetails as any), tagline: e.target.value } })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Business Address</Label>
                  <Input 
                    value={preferences.businessDetails?.address || ''} 
                    onChange={e => setPreferences({ businessDetails: { ...(preferences.businessDetails as any), address: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Number(s)</Label>
                  <Input 
                    value={preferences.businessDetails?.phone || ''} 
                    onChange={e => setPreferences({ businessDetails: { ...(preferences.businessDetails as any), phone: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Signature Label</Label>
                  <Input 
                    value={preferences.businessDetails?.signatureLabel || ''} 
                    onChange={e => setPreferences({ businessDetails: { ...(preferences.businessDetails as any), signatureLabel: e.target.value } })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Terms & Conditions</Label>
                  <textarea 
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={preferences.businessDetails?.terms || ''} 
                    onChange={e => setPreferences({ businessDetails: { ...(preferences.businessDetails as any), terms: e.target.value } })}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- STAFF TAB --- */}
        {activeTab === 'Staff' && (
          <div className="max-w-4xl space-y-8 animate-in fade-in duration-300">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <UserCircle className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-bold tracking-tight">Staff Management</h3>
              </div>
              <p className="text-sm text-muted-foreground">Manage employee access, reset PINs, and deactivate accounts.</p>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col shadow-sm">
              <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input type="text" placeholder="Search staff..." className="pl-8 pr-4 py-2 bg-background border border-border rounded-lg text-sm w-64 focus:outline-none focus:ring-1 focus:ring-primary" value={staffSearchTerm} onChange={e => setStaffSearchTerm(e.target.value)} />
                    <svg className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </div>
                </div>
                
                <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                      <Plus className="w-4 h-4 mr-2" /> Add Employee
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Employee</DialogTitle>
                      <DialogDescription>Create a new staff account. The mobile number will be used as their login ID.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} placeholder="e.g. Ramesh Kumar" />
                      </div>
                      <div className="space-y-2">
                        <Label>Mobile Number (Login ID)</Label>
                        <Input 
                          type="tel"
                          value={newStaff.mobile} 
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val.length <= 10) setNewStaff({...newStaff, mobile: val});
                          }} 
                          placeholder="10-digit number" 
                        />
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label>Access Role</Label>
                        <Select value={newStaff.role} onValueChange={v => setNewStaff({...newStaff, role: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Staff">Staff</SelectItem>
                            <SelectItem value="Manager">Manager</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-2">
                          Note: PIN will be automatically set to the last 4 digits of the mobile number.
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddStaffOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddStaff}>Create Account</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 font-semibold tracking-wider">User</th>
                      <th className="px-6 py-4 font-semibold tracking-wider">Mobile (Login ID)</th>
                      <th className="px-6 py-4 font-semibold tracking-wider">Role</th>
                      <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {employees.filter(emp => emp.name.toLowerCase().includes(staffSearchTerm.toLowerCase()) || (emp.mobile || '').includes(staffSearchTerm)).map(emp => (
                      <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20 shrink-0">
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">{emp.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-muted-foreground">{emp.mobile || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            emp.role === 'Admin' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 
                            emp.role === 'Manager' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' : 
                            'bg-slate-500/10 text-slate-600 border-slate-500/20'
                          }`}>
                            {emp.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            emp.status === 'Inactive' ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'Inactive' ? 'bg-slate-400' : 'bg-emerald-500 animate-pulse'}`}></span>
                            {emp.status === 'Inactive' ? 'Inactive' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => {
                                setSelectedStaff(emp);
                                setIsEditStaffOpen(true);
                              }}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Profile
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className={emp.status === 'Inactive' ? 'text-emerald-600' : 'text-amber-600'}
                                onClick={() => handleToggleStaffStatus(emp)}
                              >
                                {emp.status === 'Inactive' ? <UserCircle className="mr-2 h-4 w-4" /> : <Ban className="mr-2 h-4 w-4" />}
                                {emp.status === 'Inactive' ? 'Reactivate User' : 'Deactivate User'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Edit Staff Dialog */}
            <Dialog open={isEditStaffOpen} onOpenChange={setIsEditStaffOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Employee Profile</DialogTitle>
                  <DialogDescription>Modify access levels or deactivate this account.</DialogDescription>
                </DialogHeader>
                {selectedStaff && (
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input value={selectedStaff.name} onChange={e => setSelectedStaff({...selectedStaff, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Mobile Number</Label>
                      <Input 
                        type="tel"
                        value={selectedStaff?.mobile || ''} 
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 10) setSelectedStaff(prev => prev ? {...prev, mobile: val} : null);
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Access Role</Label>
                        <Select value={selectedStaff.role} onValueChange={v => setSelectedStaff({...selectedStaff, role: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Staff">Staff</SelectItem>
                            <SelectItem value="Manager">Manager</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Account Status</Label>
                        <Select value={selectedStaff.status || 'Active'} onValueChange={v => setSelectedStaff({...selectedStaff, status: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border space-y-2">
                      <Label className="text-amber-600 flex items-center gap-2"><KeyRound className="w-4 h-4"/> Reset PIN</Label>
                      <Input value={selectedStaff.pin} onChange={e => setSelectedStaff({...selectedStaff, pin: e.target.value})} placeholder="Enter new 4-digit PIN" maxLength={4} />
                      <p className="text-xs text-muted-foreground">Only change this if the employee forgot their PIN.</p>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditStaffOpen(false)}>Cancel</Button>
                  <Button onClick={handleEditStaff}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          </div>
        )}

        {/* --- INVENTORY TAB REMOVED --- */}

        {/* --- EXPORT TAB --- */}
        {activeTab === 'Export / Download' && (
          <div className="max-w-3xl space-y-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                <h3 className="text-base font-semibold">Export Data</h3>
              </div>
              <p className="text-sm text-muted-foreground ml-7">Download your records as CSV files</p>
            </div>
            
            <div className="space-y-3 ml-7">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Custom Date Range Report (CSV)</Label>
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 bg-card p-5 rounded-xl border border-border shadow-sm">
                <div className="space-y-2 w-full sm:w-auto flex-1">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">Start Date</Label>
                  <DatePicker value={exportStartDate} onChange={setExportStartDate} className="w-full" />
                </div>
                <div className="space-y-2 w-full sm:w-auto flex-1">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">End Date</Label>
                  <DatePicker value={exportEndDate} onChange={setExportEndDate} className="w-full" />
                </div>
                <Button onClick={handleExportCSV} className="w-full sm:w-auto px-6 mt-2 sm:mt-0 shadow-sm border border-border/50 font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
                  <Download className="w-4 h-4 mr-2" /> Download CSV
                </Button>
              </div>
            </div>

            <div className="space-y-3 ml-7">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Business Backup (JSON)</Label>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground border-none py-6" onClick={handleExportFull}>
                <Download className="w-4 h-4 mr-2" /> Download Full JSON Backup
              </Button>
            </div>
          </div>
        )}

                {/* --- NOTIFICATIONS TAB --- */}
        {activeTab === 'Notifications' && (
          <div className="max-w-3xl space-y-8 animate-in fade-in duration-300">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Bell className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-bold tracking-tight">Notification Settings</h3>
              </div>
              <p className="text-sm text-muted-foreground">Manage how and when you receive critical business alerts.</p>
            </div>

            {/* Master Push Toggle */}
            <div className={`p-6 rounded-2xl border transition-all ${preferences.pushEnabled ? 'border-primary/50 bg-primary/5' : 'border-border bg-card'}`}>
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Bell className={`w-5 h-5 ${preferences.pushEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                    <Label className="text-base font-bold">Browser Push Notifications</Label>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-lg">
                    Receive native OS-level alerts on this device when critical events occur. You must grant permission in your browser.
                  </p>
                </div>
                <Switch 
                  checked={preferences.pushEnabled} 
                  onCheckedChange={(enabled) => {
                    if (enabled) {
                      if (!("Notification" in window)) {
                        toast.error("This browser does not support desktop notification");
                        return;
                      }
                      if (Notification.permission === "granted") {
                        setPreferences({ pushEnabled: true });
                        new Notification("Notifications Enabled", { body: "You will now receive padmaPOS alerts!" });
                      } else if (Notification.permission !== "denied") {
                        Notification.requestPermission().then((permission) => {
                          if (permission === "granted") {
                            setPreferences({ pushEnabled: true });
                            new Notification("Notifications Enabled");
                          } else {
                            toast.error("Permission denied by browser");
                          }
                        });
                      } else {
                        toast.error("Notifications are blocked in your browser settings");
                      }
                    } else {
                      setPreferences({ pushEnabled: false });
                    }
                  }} 
                  className="scale-110"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sound & Timing */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Notification Sound</Label>
                  <Select 
                    value={preferences.notificationSound || 'Default'} 
                    onValueChange={(v) => {
                      setPreferences({ notificationSound: v });
                      playNotificationSound(v);
                    }}
                  >
                    <SelectTrigger className="bg-card h-12 rounded-xl">
                      <SelectValue placeholder="Select sound" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Default">Default</SelectItem>
                      <SelectItem value="Chime">Chime</SelectItem>
                      <SelectItem value="Bell">Bell</SelectItem>
                      <SelectItem value="Ping">Ping</SelectItem>
                      <SelectItem value="Water Drop">Water Drop</SelectItem>
                      <SelectItem value="Silent">Silent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Advance Notice Timing</Label>
                  <Select 
                    value={preferences.advanceNoticeTiming || '1 day'} 
                    onValueChange={(v) => setPreferences({ advanceNoticeTiming: v })}
                  >
                    <SelectTrigger className="bg-card h-12 rounded-xl">
                      <SelectValue placeholder="Select timing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1 hour">1 hour before</SelectItem>
                      <SelectItem value="3 hours">3 hours before</SelectItem>
                      <SelectItem value="1 day">1 day before</SelectItem>
                      <SelectItem value="2 days">2 days before</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Applies to Upcoming Orders and Expected Returns.</p>
                </div>
              </div>

              {/* Alert Matrix */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Active Alert Types</Label>
                
                <div className="space-y-4">
                  {[
                    { id: 'upcomingOrders', label: 'Upcoming Orders', desc: 'When dispatch date approaches' },
                    { id: 'expectedReturns', label: 'Expected Returns', desc: 'When return date is due' },
                    { id: 'paymentDue', label: 'Payment Due', desc: 'When promised payment is due' },
                    { id: 'newBillCreated', label: 'New Bill Created', desc: 'When a new rental is logged' },
                    { id: 'itemDispatched', label: 'Item Dispatched', desc: 'When items are marked as sent' },
                    { id: 'itemReturned', label: 'Item Returned', desc: 'When items are received back' },
                  ].map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-semibold cursor-pointer" htmlFor={alert.id}>{alert.label}</Label>
                        <p className="text-xs text-muted-foreground">{alert.desc}</p>
                      </div>
                      <Switch 
                        id={alert.id}
                        checked={(preferences.alerts as any)?.[alert.id] ?? true} 
                        onCheckedChange={(v) => setPreferences({ alerts: { ...preferences.alerts, [alert.id]: v } } as any)} 
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- DATABASE TAB --- */}
        {activeTab === 'Database' && (
          <div className="max-w-3xl space-y-8 animate-in fade-in duration-300">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Database className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-bold tracking-tight">Database Administration</h3>
              </div>
              <p className="text-sm text-muted-foreground">Manage your cloud connection, database structure, and perform critical operations.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Credentials Card Removed */}

              {/* Connection Status Card */}
              <div className="col-span-1 md:col-span-2 p-6 rounded-2xl border border-border bg-gradient-to-br from-card to-muted/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Status</Label>
                      {isDatabaseConnected ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Connected to Cloud</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                          <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">Disconnected (Local Only)</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isDatabaseConnected 
                        ? 'Your local data can be actively synced with the Supabase cluster.'
                        : 'Enter credentials and click Health Check to connect.'}
                    </p>
                  </div>
                  <Button onClick={handleHealthCheck} variant="outline" className="w-full sm:w-auto font-semibold bg-background hover:bg-muted border-border transition-all">
                    <Activity className="w-4 h-4 mr-2 text-primary" /> Run Health Check
                  </Button>
                </div>
              </div>

              {/* Repair Tool Card */}
              <div className="col-span-1 md:col-span-2 p-6 rounded-2xl border border-border bg-card space-y-4">
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-blue-500" />
                  <h4 className="text-base font-semibold">Database Repair Tool</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If the application is experiencing sync errors due to missing columns or mismatched types, you can use this tool to generate the exact SQL schema required. Run the generated SQL in your cloud provider's console to rebuild the structure without losing data.
                </p>
                <div className="pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors">
                        <Code className="w-4 h-4 mr-2" /> Generate Repair SQL
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Database Repair SQL</DialogTitle>
                        <DialogDescription>Run these commands directly in your Supabase SQL editor to fix schema mismatches.</DialogDescription>
                      </DialogHeader>
                      <div className="relative mt-4 bg-muted p-4 rounded-xl border border-border">
                        <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono text-muted-foreground">
                          {repairSQL}
                        </pre>
                        <Button variant="outline" size="icon" className="absolute top-2 right-2 h-8 w-8 bg-background border-border" onClick={copySQL}>
                          <Copy className="h-4 w-4 text-foreground" />
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            {currentUser?.role === 'Admin' && (
              <div className="mt-8 pt-8 border-t border-red-500/20">
                <div className="p-6 rounded-2xl border border-red-500/30 bg-red-500/5 space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                    <AlertTriangle className="w-24 h-24 text-red-500" />
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-base font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Danger Zone
                    </h4>
                    <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-2 mb-4 max-w-[80%]">
                      This action will permanently delete all bills, inventory, and employees from the database. It cannot be undone. This is typically only used when resetting the system for a new business season or transferring ownership.
                    </p>
                    <AlertDialog open={isWipeDialogOpen} onOpenChange={setIsWipeDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="font-bold bg-red-600 hover:bg-red-700 text-white border-none shadow-lg shadow-red-500/20">
                          <Trash2 className="w-4 h-4 mr-2" /> Wipe Entire Database
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-red-600 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will instantly wipe your entire local cache and sync the deletion to the cloud. You will lose ALL bills, items, and employees.<br/><br/>
                            Type <strong className="text-foreground select-none">DELETE EVERYTHING</strong> to confirm.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="my-4">
                          <input 
                            type="text" 
                            className="w-full h-10 px-3 rounded-md border border-red-500 bg-background text-foreground" 
                            placeholder="DELETE EVERYTHING" 
                            value={wipeConfirmation} 
                            onChange={(e) => setWipeConfirmation(e.target.value)}
                          />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setWipeConfirmation('')}>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-red-600 hover:bg-red-700 text-white border-none"
                            onClick={(e) => {
                              if (wipeConfirmation !== 'DELETE EVERYTHING') {
                                e.preventDefault();
                                toast.error('Incorrect confirmation phrase');
                              } else {
                                handleWipeDatabase();
                              }
                            }}
                          >
                            Execute Wipe
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- PASSWORD TAB --- */}
        {activeTab === 'Password' && (
          <div className="max-w-3xl space-y-8 animate-in fade-in duration-300">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <KeyRound className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-bold tracking-tight">Security & Password</h3>
              </div>
              <p className="text-sm text-muted-foreground">Change your account login PIN.</p>
            </div>
            
            <div className="p-6 rounded-2xl border border-border bg-card space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Current PIN</Label>
                  <Input 
                    type="password" 
                    maxLength={4} 
                    placeholder="****" 
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                    className="h-12 text-center text-xl tracking-[0.5em] font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">New PIN</Label>
                  <Input 
                    type="password" 
                    maxLength={4} 
                    placeholder="****" 
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    className="h-12 text-center text-xl tracking-[0.5em] font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Confirm New PIN</Label>
                  <Input 
                    type="password" 
                    maxLength={4} 
                    placeholder="****" 
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    className="h-12 text-center text-xl tracking-[0.5em] font-mono"
                  />
                </div>
              </div>
              
              <Button onClick={() => {
                if (activeUser) {
                  if (currentPin !== activeUser.pin) {
                    toast.error('Current PIN is incorrect');
                    return;
                  }
                  if (newPin.length !== 4) {
                    toast.error('New PIN must be exactly 4 digits');
                    return;
                  }
                  if (newPin !== confirmPin) {
                    toast.error('New PINs do not match');
                    return;
                  }
                  if (currentPin === newPin) {
                    toast.error('New PIN must be different from current PIN');
                    return;
                  }
                  const updatedUser = { ...activeUser, pin: newPin };
                  setCurrentUser(updatedUser);
                  updateEmployee(activeUser.id, updatedUser);
                  syncUpToCloud().then((res) => {
                    if (!res.success) toast.error('PIN changed locally, but ' + res.error);
                    else toast.success('PIN successfully changed and synced');
                  }).catch(() => toast.error('Failed to sync to cloud'));
                  setCurrentPin('');
                  setNewPin('');
                  setConfirmPin('');
                }
              }} className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all">
                Update Password
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
