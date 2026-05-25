import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pprbxziatkdikhlztsgl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwcmJ4emlhdGtkaWtobHp0c2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzA1MjIsImV4cCI6MjA5NTMwNjUyMn0.1aHFV2ZMBkyMc61e_aoMR4Tp5bA8xr2Z79CHOQIvpGA';

export const supabase = createClient(supabaseUrl, supabaseKey);
