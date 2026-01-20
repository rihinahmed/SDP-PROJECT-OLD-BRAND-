// src/config/supabase.js - FIXED VERSION
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error('ERROR: Missing Supabase credentials in .env file');
    console.error('Required: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY');
    process.exit(1);
}

// IMPORTANT: For backend operations, use service key to bypass RLS
// This is the main client that should be used in controllers
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Admin client (same as supabase for backend)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

console.log('✅ Supabase initialized with service key');

module.exports = { supabase, supabaseAdmin };