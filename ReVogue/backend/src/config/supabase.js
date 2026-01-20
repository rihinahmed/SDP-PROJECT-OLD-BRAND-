// src/config/supabase.js - CORRECT VERSION
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

// Create client factory that sets JWT per request
function getSupabaseClient(accessToken = null) {
    if (accessToken) {
        // For authenticated requests - use service key but set JWT
        return createClient(supabaseUrl, supabaseServiceKey, {
            global: {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            },
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    }
    
    // For unauthenticated/public requests - use anon key
    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

// Default client for public operations (uses anon key)
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Admin client for operations that need to bypass RLS (uses service key)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

console.log('✅ Supabase initialized');

module.exports = { supabase, supabaseAdmin, getSupabaseClient };