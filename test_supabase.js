const { createClient } = require('@supabase/supabase-js');
const url = "https://dinjwrdcrwqqynjtoduv.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpbmp3cmRjcndxcXluanRvZHV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTE3NjYxNCwiZXhwIjoyMDk2NzUyNjE0fQ.RHNsz_jv4CG5M44s3fKWzrEx508xwD5mMarAQ0faoX0";
const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('bills').select('*').limit(1);
  console.log("Error:", error);
}
test();
