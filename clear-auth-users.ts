import { createClient } from '@supabase/supabase-js';

// Note: This requires the SERVICE_ROLE_KEY, not the anon key
// You can find it in Supabase Dashboard > Project Settings > API > service_role key
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  console.error('Add SUPABASE_SERVICE_ROLE_KEY to your .env file');
  console.error('Find it in: Supabase Dashboard > Project Settings > API > service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function clearTestUsers() {
  try {
    // Get all users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) throw listError;

    console.log(`Found ${users.length} users`);

    // Delete users
    for (const user of users) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.error(`Failed to delete user ${user.email}:`, deleteError.message);
      } else {
        console.log(`✅ Deleted user: ${user.email}`);
      }
    }

    console.log('\n✅ All users cleared!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

clearTestUsers();
