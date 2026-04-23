import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ndqgsemywmooixscgfoc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcWdzZW15d21vb2l4c2NnZm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMjM1OTAsImV4cCI6MjA4OTc5OTU5MH0.YaoaZyavNH0Gi3Bo18VgjKN7J1-63DGHojpuvh47UHs';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBuckets() {
  const { data, error } = await supabase.storage.listBuckets();
  console.log('Buckets:', data?.map(b => b.name));
  console.log('Error:', error);
}

checkBuckets();
