import { createClient } from '@supabase/supabase-js';
import { useStore } from '../store/useStore';
import { Bill, InventoryItem, Employee } from '../types';

export const getSupabaseClient = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

  if (!url || !key) return null;
  
  try {
    const cleanUrl = url.split('/rest')[0].trim().replace(/\/$/, '');
    return createClient(cleanUrl, key.trim());
  } catch (err) {
    console.error("Invalid Supabase Credentials:", err);
    return null;
  }
};

// ---------------------------------------------------------
// PULL / DOWNLOAD (Supabase -> LocalStorage)
// ---------------------------------------------------------
export const syncDownFromCloud = async (): Promise<{success: boolean, error?: string}> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Database not connected. Please enter credentials in Settings.' };

  try {
    // 1. Fetch Bills
    const { data: billsData, error: billsErr } = await supabase.from('bills').select('*');
    if (billsErr) throw billsErr;

    // 2. Fetch Inventory
    const { data: invData, error: invErr } = await supabase.from('inventory').select('*');
    if (invErr) throw invErr;

    // 3. Fetch Employees
    const { data: empData, error: empErr } = await supabase.from('employees').select('*');
    if (empErr) throw empErr;

    // Update Zustand Store (which automatically updates localStorage via the actions/setters)
    if (billsData) {
      useStore.getState().setBills(billsData as Bill[]);
    }
    
    if (invData) {
      useStore.getState().setInventory(invData as InventoryItem[]);
    }
    
    if (empData) {
      useStore.getState().setEmployees(empData as Employee[]);
    }

    useStore.getState().setIsDatabaseConnected(true);
    useStore.getState().setLastSyncTime(new Date().toISOString());

    return { success: true };
  } catch (err: any) {
    console.error('Sync Down Error:', err);
    return { success: false, error: err.message };
  }
};

// ---------------------------------------------------------
// PUSH / UPLOAD (LocalStorage -> Supabase)
// ---------------------------------------------------------
export const syncUpToCloud = async (): Promise<{success: boolean, error?: string}> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Database not connected. Please enter credentials in Settings.' };

  const state = useStore.getState();
  const bills = state.bills;
  const inventory = state.inventory;
  const employees = state.employees;

  try {
    const promises = [];

    // 1. Push Bills
    if (bills.length > 0) {
      promises.push(supabase.from('bills').upsert(bills, { onConflict: 'id' }));
    }

    // 2. Push Inventory
    if (inventory.length > 0) {
      const safeInventory = inventory.map(i => ({
        ...i,
        qtyAvailable: i.qtyAvailable || 0
      }));
      promises.push(supabase.from('inventory').upsert(safeInventory, { onConflict: 'id' }));
    }

    // 3. Push Employees
    if (employees.length > 0) {
      const safeEmployees = employees.map(e => ({
        id: e.id,
        name: e.name,
        role: e.role,
        status: e.status || 'Active',
        mobile: e.mobile || '0000000000',
        pin: e.pin || '1234'
      }));
      promises.push(supabase.from('employees').upsert(safeEmployees, { onConflict: 'id' }));
    }

    const results = await Promise.all(promises);
    for (const result of results) {
      if (result.error) throw result.error;
    }

    useStore.getState().setIsDatabaseConnected(true);
    useStore.getState().setLastSyncTime(new Date().toISOString());

    return { success: true };
  } catch (err: any) {
    console.error('Sync Up Error:', err);
    return { success: false, error: err.message };
  }
};
