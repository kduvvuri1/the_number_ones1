// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
});

// Enhanced RLS helper with better error handling
export async function setRLSUser(userId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('set_current_user_id', { 
      user_id_param: userId 
    });
    
    if (error) {
      console.error('Failed to set RLS user:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in setRLSUser:', error);
    throw error;
  }
}

// Helper to ensure RLS is set before operations
export async function withRLS<T>(userId: string, operation: () => Promise<T>): Promise<T> {
  await setRLSUser(userId);
  return await operation();
}