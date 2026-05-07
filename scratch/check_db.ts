
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function check() {
    console.log('--- Comprobando Tabla api_clients ---');
    const { data, error } = await supabase.from('api_clients').select('*').limit(1);
    if (error) {
        console.error('❌ Error al acceder a api_clients:', error.message);
    } else {
        console.log('✅ Tabla accesible.');
        console.log('--- Probando Inserción ---');
        const { data: insData, error: insError } = await supabase
            .from('api_clients')
            .insert([{ name: 'Test', email: 'test2@test.com', apikey: 'sk_test_123' }])
            .select();
        
        if (insError) {
            console.error('❌ Error en inserción:', insError.message);
        } else {
            console.log('✅ Inserción exitosa:', insData);
            // Limpiar prueba
            await supabase.from('api_clients').delete().eq('email', 'test@test.com');
        }
    }
}

check();
