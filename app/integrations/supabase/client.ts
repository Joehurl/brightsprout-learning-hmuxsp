import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://oxdvulyaynmqraztwjft.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94ZHZ1bHlheW5tcXJhenR3amZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2ODM0ODIsImV4cCI6MjEwNTI1OTQ4Mn0.DUr6_e3s5s8XShmVSYZau6ru9KnD2hh4-VwtrJpy5U8";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
