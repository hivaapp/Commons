import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// ---------- Environment validation ----------

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl) {
    throw new Error(
        'Missing VITE_SUPABASE_URL. Add it to your .env file.\n' +
        'Example: VITE_SUPABASE_URL=https://your-project.supabase.co'
    );
}

if (!supabaseAnonKey) {
    throw new Error(
        'Missing VITE_SUPABASE_ANON_KEY. Add it to your .env file.\n' +
        'Example: VITE_SUPABASE_ANON_KEY=eyJ...'
    );
}

// Validate URL format
try {
    new URL(supabaseUrl);
} catch {
    throw new Error(
        `Invalid VITE_SUPABASE_URL: "${supabaseUrl}". Must be a valid URL.`
    );
}

// ---------- Client ----------

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
    },
});
