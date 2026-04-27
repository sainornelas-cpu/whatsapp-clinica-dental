const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment from .env.local.example
const envPath = path.join(__dirname, '..', '.env.local.example');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...values] = line.split('=');
    if (key && values.length) {
      env[key.trim()] = values.join('=').trim();
    }
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function setupAdmin() {
  const email = 'sain.ornelas@uabc.edu.mx';
  const password = 'DentalAdmin2026!';

  console.log('Setting up admin user...');

  // Check if user already exists
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('Error listing users:', error);
    process.exit(1);
  }

  const existingUser = data.users.find(u => u.email === email);

  if (existingUser) {
    console.log('✓ Admin user already exists:', email);
    console.log('  User ID:', existingUser.id);
    console.log('  You can login at: https://whatsapp-clinica-dental.vercel.app/login');
    return;
  }

  // Create new admin user
  console.log('Creating new admin user...');
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: 'admin',
      full_name: 'Alfredo Sain Ornelas'
    }
  });

  if (createError) {
    console.error('Error creating admin user:', createError);
    process.exit(1);
  }

  console.log('✓ Admin user created successfully!');
  console.log('  Email:', email);
  console.log('  Password:', password);
  console.log('\n  Login at: https://whatsapp-clinica-dental.vercel.app/login');
}

setupAdmin().catch(console.error);
