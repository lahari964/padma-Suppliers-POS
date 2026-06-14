import { create } from 'zustand';
import { Bill, InventoryItem, Employee, UserSession } from '../types';
import { DEFAULT_INVENTORY, DEFAULT_EMPLOYEES } from '../lib/constants';

interface StoreState {
  bills: Bill[];
  inventory: InventoryItem[];
  employees: Employee[];
  currentUser: UserSession | null;
  isDatabaseConnected: boolean;
  lastSyncTime: string | null;
  visualTheme: string;
  colorTheme: string;
  preferences: {
    businessDetails: {
      name: string;
      tagline: string;
      address: string;
      phone: string;
      terms: string;
      signatureLabel: string;
    };
    receiptTemplate: string;
    defaultPdfFormat?: string;
    thermalSize: string;
    supabaseUrl?: string;
    supabaseKey?: string;
    compactView: boolean;
    notificationSound: string;
    pushEnabled: boolean;
    advanceNoticeTiming: string;
    alerts: {
      upcomingOrders: boolean;
      expectedReturns: boolean;
      paymentDue: boolean;
      newBillCreated: boolean;
      itemDispatched: boolean;
      itemReturned: boolean;
    };
  };
  
  setBills: (bills: Bill[]) => void;
  setInventory: (inventory: InventoryItem[]) => void;
  updateInventoryQty: (id: string, delta: number) => void;
  reduceTotalInventory: (id: string, delta: number) => void;
  setEmployees: (employees: Employee[]) => void;
  setCurrentUser: (user: UserSession | null) => void;
  setIsDatabaseConnected: (status: boolean) => void;
  setLastSyncTime: (time: string | null) => void;
  setVisualTheme: (theme: string) => void;
  setColorTheme: (theme: string) => void;
  
  addBill: (bill: Bill) => void;
  updateBill: (id: string, updated: Partial<Bill>) => void;
  deleteBill: (id: string) => void;
  setPreferences: (prefs: Partial<StoreState['preferences']>) => void;
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, updated: Partial<Employee>) => void;
}

export const useStore = create<StoreState>((set) => ({
  bills: (() => {
    const saved = localStorage.getItem('sadma_bills');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return parsed.map((b: any) => {
        if (b.billingStarted) {
          b.items = b.items.map((i: any) => {
             if (i.isDispatched === false && !i.isAddedPostBilling) {
                 return { ...i, isDispatched: true, dispatchDate: i.issueDate, dispatchTime: i.issueTime };
             }
             return i;
          });
        }
        return b;
      });
    } catch { return []; }
  })(),
  inventory: (() => {
    const saved = localStorage.getItem('sadma_inventory');
    return saved ? JSON.parse(saved) : DEFAULT_INVENTORY;
  })(),
  employees: (() => {
    const saved = localStorage.getItem('sadma_employees');
    return saved ? JSON.parse(saved) : DEFAULT_EMPLOYEES;
  })(),
  currentUser: (() => {
    const saved = sessionStorage.getItem('sadma_current_user');
    return saved ? JSON.parse(saved) : null;
  })(),
  isDatabaseConnected: false,
  lastSyncTime: null,
  visualTheme: 'minimal',
  colorTheme: 'purple',
  preferences: (() => {
    const saved = localStorage.getItem('sadma_preferences');
    return saved ? JSON.parse(saved) : {
      businessDetails: {
        name: 'Padma Suppliers',
        tagline: 'Premium Quality (since 1977)',
        address: 'ganugapalem, ongole, Andhra Pradesh -523001',
        phone: '+91 9000000000, +91 8000000000, +91 7000000000, 08592-238543',
        terms: '1. Transportation and delivery charges are extra.\n2. Customers are fully liable for any damage or loss of rented items and must cover repair/replacement costs.\n3. All payments must be settled strictly according to the prior agreed terms.\n4. Late returns will incur additional daily rental fees.',
        signatureLabel: 'For Padma Suppliers'
      },
      receiptTemplate: 'Standard A4',
      thermalSize: '80mm',
      compactView: false,
      notificationSound: 'Default',
      pushEnabled: false,
      advanceNoticeTiming: '1 day',
      alerts: {
        upcomingOrders: true,
        expectedReturns: true,
        paymentDue: true,
        newBillCreated: true,
        itemDispatched: true,
        itemReturned: true
      }
    };
  })(),

  setBills: (bills) => set({ 
    bills: bills.map((b: any) => {
      if (b.billingStarted) {
        b.items = b.items.map((i: any) => {
           if (i.isDispatched === false && !i.isAddedPostBilling) {
               return { ...i, isDispatched: true, dispatchDate: i.issueDate, dispatchTime: i.issueTime };
           }
           return i;
        });
      }
      return b;
    }) 
  }),
  setInventory: (inventory) => {
    localStorage.setItem('sadma_inventory', JSON.stringify(inventory));
    set({ inventory });
  },
  updateInventoryQty: (id, delta) => set((state) => {
    const newInventory = state.inventory.map(item => 
      item.id === id ? { ...item, qtyAvailable: Math.max(0, (item.qtyAvailable || 0) + delta) } : item
    );
    localStorage.setItem('sadma_inventory', JSON.stringify(newInventory));
    import('../lib/supabase').then(({ syncUpToCloud }) => syncUpToCloud().catch(console.error));
    return { inventory: newInventory };
  }),
  reduceTotalInventory: (id, delta) => set((state) => {
    const newInventory = state.inventory.map(item => 
      item.id === id ? { 
        ...item, 
        // We only track qtyAvailable right now, but if totalQuantity existed we'd reduce it.
        // Reducing the available quantity is essentially permanently destroying it from circulation.
        qtyAvailable: Math.max(0, (item.qtyAvailable || 0) - delta)
      } : item
    );
    localStorage.setItem('sadma_inventory', JSON.stringify(newInventory));
    return { inventory: newInventory };
  }),
  setEmployees: (employees) => {
    localStorage.setItem('sadma_employees', JSON.stringify(employees));
    set({ employees });
  },
  setCurrentUser: (user) => {
    if (user) {
      sessionStorage.setItem('sadma_current_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('sadma_current_user');
    }
    set({ currentUser: user });
  },
  setIsDatabaseConnected: (isDatabaseConnected) => set({ isDatabaseConnected }),
  setLastSyncTime: (lastSyncTime) => set({ lastSyncTime }),
  setVisualTheme: (visualTheme) => set({ visualTheme }),
  setColorTheme: (colorTheme) => set({ colorTheme }),

  addBill: (bill) => set((state) => {
    const newBills = [...state.bills, bill];
    localStorage.setItem('sadma_bills', JSON.stringify(newBills));
    return { bills: newBills };
  }),
  updateBill: (id, updated) => set((state) => {
    const newBills = state.bills.map(b => b.id === id ? { ...b, ...updated } : b);
    localStorage.setItem('sadma_bills', JSON.stringify(newBills));
    import('../lib/supabase').then(({ syncUpToCloud }) => syncUpToCloud().catch(console.error));
    return { bills: newBills };
  }),
  deleteBill: (id) => set((state) => {
    const newBills = state.bills.filter(b => b.id !== id);
    localStorage.setItem('sadma_bills', JSON.stringify(newBills));
    
    // Immediately tell the API to delete it from Supabase
    const password = import.meta.env.VITE_APP_PASSWORD || 'padma_pos_secure_2024';
    fetch(`/api/sync?id=${id}`, {
       method: 'DELETE',
       headers: { 'Authorization': password }
    }).catch(console.error);
    
    return { bills: newBills };
  }),
  setPreferences: (prefs) => set((state) => {
    const newPrefs = { ...state.preferences, ...prefs, alerts: { ...state.preferences.alerts, ...(prefs.alerts || {}) }, businessDetails: { ...state.preferences.businessDetails, ...(prefs.businessDetails || {}) } };
    localStorage.setItem('sadma_preferences', JSON.stringify(newPrefs));
    return { preferences: newPrefs };
  }),
  addEmployee: (employee) => set((state) => {
    const newEmployees = [...state.employees, employee];
    localStorage.setItem('sadma_employees', JSON.stringify(newEmployees));
    import('../lib/supabase').then(({ syncUpToCloud }) => syncUpToCloud().catch(console.error));
    return { employees: newEmployees };
  }),
  updateEmployee: (id, updated) => set((state) => {
    const newEmployees = state.employees.map(e => e.id === id ? { ...e, ...updated } : e);
    localStorage.setItem('sadma_employees', JSON.stringify(newEmployees));
    import('../lib/supabase').then(({ syncUpToCloud }) => syncUpToCloud().catch(console.error));
    return { employees: newEmployees };
  }),
}));
