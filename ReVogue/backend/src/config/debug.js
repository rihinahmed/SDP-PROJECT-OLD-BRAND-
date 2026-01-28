// debug_supabase.js - Run this to test your Supabase configuration
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function debugSupabase() {
    log('\n╔════════════════════════════════════════╗', 'blue');
    log('║   Supabase Configuration Debug         ║', 'blue');
    log('╚════════════════════════════════════════╝\n', 'blue');

    // Step 1: Check environment variables
    log('1️⃣  Checking Environment Variables...', 'blue');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl) {
        log('❌ SUPABASE_URL is missing!', 'red');
        log('   Add it to your .env file', 'yellow');
        return;
    } else {
        log(`✅ SUPABASE_URL: ${supabaseUrl}`, 'green');
    }

    if (!supabaseAnonKey) {
        log('❌ SUPABASE_ANON_KEY is missing!', 'red');
        log('   Add it to your .env file', 'yellow');
        return;
    } else {
        log(`✅ SUPABASE_ANON_KEY: ${supabaseAnonKey.substring(0, 20)}...`, 'green');
    }

    if (!supabaseServiceKey) {
        log('❌ SUPABASE_SERVICE_KEY is missing!', 'red');
        log('   Add it to your .env file', 'yellow');
        return;
    } else {
        log(`✅ SUPABASE_SERVICE_KEY: ${supabaseServiceKey.substring(0, 20)}...`, 'green');
    }

    // Step 2: Test Admin Client
    log('\n2️⃣  Testing Admin Client Connection...', 'blue');
    try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Test connection by listing users
        const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
        
        if (error) {
            log('❌ Admin client connection failed!', 'red');
            log(`Error: ${error.message}`, 'red');
            log('\nPossible issues:', 'yellow');
            log('- Service key is incorrect', 'yellow');
            log('- Supabase project URL is wrong', 'yellow');
            log('- Network/firewall blocking connection', 'yellow');
            return;
        }
        
        log(`✅ Admin client connected successfully!`, 'green');
        log(`   Found ${users.users.length} users in database`, 'green');
    } catch (error) {
        log('❌ Admin client error!', 'red');
        log(`Error: ${error.message}`, 'red');
        return;
    }

    // Step 3: Test Database Tables
    log('\n3️⃣  Checking Database Tables...', 'blue');
    try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        
        // Check profiles table
        const { data: profiles, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .limit(1);
        
        if (profileError) {
            log('❌ Profiles table error!', 'red');
            log(`Error: ${profileError.message}`, 'red');
            log('\nThis usually means:', 'yellow');
            log('- Profiles table does not exist', 'yellow');
            log('- RLS policies are blocking access', 'yellow');
            log('\nSolution: Re-run the supabase_setup_safe.sql', 'yellow');
        } else {
            log('✅ Profiles table accessible', 'green');
        }

        // Check products table
        const { data: products, error: productError } = await supabaseAdmin
            .from('products')
            .select('*')
            .limit(1);
        
        if (productError) {
            log('⚠️  Products table error (this may be okay if empty)', 'yellow');
            log(`Error: ${productError.message}`, 'yellow');
        } else {
            log('✅ Products table accessible', 'green');
        }

    } catch (error) {
        log('❌ Database table check failed!', 'red');
        log(`Error: ${error.message}`, 'red');
    }

    // Step 4: Test User Creation
    log('\n4️⃣  Testing User Registration Flow...', 'blue');
    try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        const testEmail = `debug_test_${Date.now()}@example.com`;
        
        log(`Creating test user: ${testEmail}`, 'yellow');
        
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: testEmail,
            password: 'TestPassword123!',
            email_confirm: true,
            user_metadata: {
                username: 'debugtest',
                full_name: 'Debug Test'
            }
        });

        if (error) {
            log('❌ User creation failed!', 'red');
            log(`Error: ${error.message}`, 'red');
            log(`Error code: ${error.code || 'unknown'}`, 'red');
            
            if (error.message.includes('Database error')) {
                log('\n🔍 This is your issue! Database trigger is failing.', 'yellow');
                log('Solutions:', 'yellow');
                log('1. Check Supabase logs: Dashboard → Logs → Postgres Logs', 'yellow');
                log('2. Re-run supabase_setup_safe.sql', 'yellow');
                log('3. Check if trigger exists:', 'yellow');
                log('   SELECT * FROM information_schema.triggers WHERE trigger_name = \'on_auth_user_created\';', 'yellow');
            }
            
            return;
        }
        
        log(`✅ User created successfully! ID: ${data.user.id}`, 'green');
        
        // Wait for trigger to execute
        log('Waiting 2 seconds for profile creation trigger...', 'yellow');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if profile was created
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
        
        if (profileError) {
            log('❌ Profile was NOT created by trigger!', 'red');
            log(`Error: ${profileError.message}`, 'red');
            log('\n🔍 The trigger is not working!', 'yellow');
            log('Run this in Supabase SQL Editor:', 'yellow');
            log(`SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';`, 'yellow');
            
            // Clean up test user
            await supabaseAdmin.auth.admin.deleteUser(data.user.id);
            return;
        }
        
        log('✅ Profile created successfully by trigger!', 'green');
        log(`   Username: ${profile.username}`, 'green');
        log(`   Full name: ${profile.full_name}`, 'green');
        
        // Clean up test user
        log('\nCleaning up test user...', 'yellow');
        await supabaseAdmin.auth.admin.deleteUser(data.user.id);
        log('✅ Test user deleted', 'green');
        
    } catch (error) {
        log('❌ Registration test failed!', 'red');
        log(`Error: ${error.message}`, 'red');
        console.error(error);
    }

    // Final Summary
    log('\n╔════════════════════════════════════════╗', 'blue');
    log('║   Debug Complete!                      ║', 'blue');
    log('╚════════════════════════════════════════╝\n', 'blue');
    
    log('If all checks passed ✅, your configuration is correct!', 'green');
    log('If any failed ❌, follow the suggested solutions above.', 'yellow');
}

// Run debug
debugSupabase().catch(error => {
    log('\n❌ Unexpected error:', 'red');
    console.error(error);
});