import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,           // Persist session in storage (default: true)
        storageKey: 'ecoconnect-auth',  // Custom key for localStorage
        autoRefreshToken: true,         // Auto-refresh token before expiry
        detectSessionInUrl: true,       // Detect OAuth session in URL
    },
});
