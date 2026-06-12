const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://dinjwrdcrwqqynjtoduv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpbmp3cmRjcndxcXluanRvZHV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTE3NjYxNCwiZXhwIjoyMDk2NzUyNjE0fQ.RHNsz_jv4CG5M44s3fKWzrEx508xwD5mMarAQ0faoX0";
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const dummyBill = {
    id: "BLL-TEST-12345",
    customerName: "Test Auto Sync",
    mobile: "0000000000",
    address: "test",
    referral: "",
    items: [],
    totalCost: 100,
    advance: 0,
    discount: 0,
    status: "Active",
    damageCharges: null,
    damageDetails: null,
    transportationCharges: 0,
    eventDate: "2026-06-12",
    eventTime: "12:00",
    expectedReturnDate: "",
    returnHistory: [],
    payments: [],
    paymentPromiseDate: null,
    createdBy: "Admin",
    notes: "",
    billingStarted: null,
    auditTrail: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  const { data, error } = await supabase.from('bills').upsert([dummyBill], { onConflict: 'id' });
  if (error) {
    console.error("UPSERT ERROR:", error);
  } else {
    console.log("UPSERT SUCCESS!");
  }
}

test();
