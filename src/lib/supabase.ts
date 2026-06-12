import { useStore } from '../store/useStore';
import { Bill, InventoryItem, Employee } from '../types';

// The app password used to authenticate with our Vercel Serverless Function
const getAppPassword = () => {
  return import.meta.env.VITE_APP_PASSWORD || '';
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

    // Update Zustand Store (which automatically updates localStorage via the actions/setters)
    if (bills) useStore.getState().setBills(bills as Bill[]);
    if (inventory) useStore.getState().setInventory(inventory as InventoryItem[]);
    if (employees) useStore.getState().setEmployees(employees as Employee[]);

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
