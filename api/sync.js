import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

export default async function handler(req, res) {
  // 1. Verify App Password
  const authHeader = req.headers.authorization;
  const EXPECTED_PASSWORD = process.env.APP_PASSWORD || 'padma_pos_secure_2024';

  if (!EXPECTED_PASSWORD || authHeader !== EXPECTED_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  // 2. Initialize Supabase
  const url = process.env.VITE_SUPABASE_URL; // Can still use VITE_ prefix here since it exists in Vercel
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    return res.status(500).json({ success: false, error: 'Server misconfiguration: Missing Supabase credentials.' });
  }

  const cleanUrl = url.split('/rest')[0].trim().replace(/\/$/, '');
  const supabase = createClient(cleanUrl, key.trim(), {
    auth: { persistSession: false },
    realtime: { transport: ws }
  });

  // 3. Handle GET (Sync Down)
  if (req.method === 'GET') {
    try {
      const [billsData, invData, empData] = await Promise.all([
        supabase.from('bills').select('*'),
        supabase.from('inventory').select('*'),
        supabase.from('employees').select('*')
      ]);

      if (billsData.error) throw billsData.error;
      if (invData.error) throw invData.error;
      if (empData.error) throw empData.error;

      return res.status(200).json({
        success: true,
        data: {
          bills: billsData.data,
          inventory: invData.data,
          employees: empData.data
        }
      });
    } catch (error) {
      console.error('Server GET Error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // 4. Handle POST (Sync Up)
  if (req.method === 'POST') {
    try {
      const { bills = [], inventory = [], employees = [] } = req.body;
      const promises = [];

      if (bills.length > 0) {
        promises.push(supabase.from('bills').upsert(bills, { onConflict: 'id' }));
      }

      if (inventory.length > 0) {
        const safeInventory = inventory.map(i => ({
          ...i,
          qtyAvailable: i.qtyAvailable || 0
        }));
        promises.push(supabase.from('inventory').upsert(safeInventory, { onConflict: 'id' }));
      }

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

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Server POST Error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // 5. Handle DELETE (Delete Bill)
  if (req.method === 'DELETE') {
    try {
      const id = req.query.id;
      if (!id) return res.status(400).json({ success: false, error: 'Missing bill ID' });

      const { error } = await supabase.from('bills').delete().eq('id', id);
      if (error) throw error;

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Server DELETE Error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // Fallback
  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
