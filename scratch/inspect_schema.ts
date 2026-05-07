
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function inspectSchema() {
    console.log('--- Inspeccionando Columnas Reales ---');
    // Insertamos solo lo mínimo
    const { data, error } = await supabase
        .from('api_clients')
        .insert([{ name: 'Inspector', email: 'inspector@test.com' }])
        .select()
        .single();

    if (error) {
        console.error('❌ Error al insertar mínimo:', error.message);
        console.log('Probablemente hay campos obligatorios que faltan.');
    } else {
        console.log('✅ Registro insertado. Columnas encontradas:');
        console.log(Object.keys(data));
        // Limpiar
        await supabase.from('api_clients').delete().eq('email', 'inspector@test.com');
    }
}

inspectSchema();
