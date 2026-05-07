
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function checkApiKeysTable() {
    console.log('--- Verificando Tabla api_keys ---');
    const { data, error } = await supabase.from('api_keys').select('*').limit(1);
    if (error) {
        console.error('❌ La tabla api_keys no existe o no es accesible:', error.message);
    } else {
        console.log('✅ ¡La tabla api_keys EXISTE! Columnas:', data[0] ? Object.keys(data[0]) : 'Tabla vacía');
    }
}

checkApiKeysTable();
