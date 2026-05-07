
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function inspectApiKeys() {
    console.log('--- Inspeccionando Tabla api_keys ---');
    const { data, error } = await supabase
        .from('api_keys')
        .insert([{ client_id: '00000000-0000-0000-0000-000000000000', key_hash: 'test' }])
        .select();

    if (error) {
        console.log('❌ Falló inserción. Mensaje de error:', error.message);
    } else {
        console.log('✅ Inserción simulada exitosa. Columnas:', Object.keys(data[0]));
        await supabase.from('api_keys').delete().eq('api_key', 'test');
    }
}

inspectApiKeys();
