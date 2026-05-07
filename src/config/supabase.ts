import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''; // Usar la Service Key para saltar RLS desde el backend

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Faltan las credenciales de Supabase en el archivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
