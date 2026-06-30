import { useStore } from '../store/useStore';
import { Bill, InventoryItem, Employee } from '../types';

// The app password used to authenticate with our Vercel Serverless Function
const getAppPassword = () => {
  return import.meta.env.VITE_APP_PASSWORD || 'padma_pos_secure_2024';
};

// ---------------------------------------------------------
// PULL / DOWNLOAD (Supabase -> LocalStorage)
// ---------------------------------------------------------
export const syncDownFromCloud = async (): Promise<{success: boolean, error?: string}> => {
  const password = getAppPassword();
  if (!password) return { success: false, error: 'Database not connected. Please enter credentials in Settings.' };

  try {
    const response = await fetch('/api/sync', {
      method: 'GET',
      headers: {
        'Authorization': password,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to fetch data from cloud');
    }

    const { bills, inventory, employees } = result.data;
    
    const state = useStore.getState();
    const lastSyncStr = state.lastSyncTime;
    const lastSyncDate = lastSyncStr ? new Date(lastSyncStr).getTime() : 0;

    if (bills) {
      const cloudBills = bills as Bill[];
      const mergedBills = cloudBills.map(cloudBill => {
        const localBill = state.bills.find(b => b.id === cloudBill.id);
        if (!localBill) return cloudBill; // New from cloud
        
        const localUpdated = localBill.updatedAt ? new Date(localBill.updatedAt).getTime() : 0;
        
        // If locally modified AFTER last sync, AND cloud is different -> CONFLICT
        if (localUpdated > lastSyncDate && localBill.updatedAt !== cloudBill.updatedAt) {
          return {
            ...localBill,
            hasConflict: true,
            conflictData: JSON.stringify(cloudBill)
          };
        }
        
        return cloudBill; // Cloud wins if no local changes
      });
      
      // Add local bills that haven't been pushed yet (not in cloud)
      const localOnly = state.bills.filter(b => !cloudBills.some(cb => cb.id === b.id));
      state.setBills([...mergedBills, ...localOnly]);
    }

    if (inventory) {
      const cloudInv = inventory as InventoryItem[];
      const mergedInv = cloudInv.map(cloudItem => {
        const localItem = state.inventory.find(i => i.id === cloudItem.id);
        if (!localItem) return cloudItem;

        const localUpdated = localItem.updatedAt ? new Date(localItem.updatedAt).getTime() : 0;
        
        if (localUpdated > lastSyncDate && localItem.updatedAt !== cloudItem.updatedAt) {
          return {
            ...localItem,
            hasConflict: true,
            qtyAvailable: cloudItem.qtyAvailable! < 0 ? 0 : localItem.qtyAvailable // negative stock fix
          };
        }
        return cloudItem;
      });
      
      const localOnlyInv = state.inventory.filter(i => !cloudInv.some(ci => ci.id === i.id));
      state.setInventory([...mergedInv, ...localOnlyInv]);
    }

    if (employees) state.setEmployees(employees as Employee[]);

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
  const password = getAppPassword();
  if (!password) return { success: false, error: 'Database not connected. Please enter credentials in Settings.' };

  const state = useStore.getState();
  const bills = state.bills;
  const inventory = state.inventory;
  const employees = state.employees;

  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Authorization': password,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bills,
        inventory,
        employees
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to push data to cloud');
    }

    useStore.getState().setIsDatabaseConnected(true);
    useStore.getState().setLastSyncTime(new Date().toISOString());

    return { success: true };
  } catch (err: any) {
    console.error('Sync Up Error:', err);
    return { success: false, error: err.message };
  }
};
