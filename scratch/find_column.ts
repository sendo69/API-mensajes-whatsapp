
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function findCorrectColumn() {
    const variations = ['api_key', 'apikey', 'api_keys', 'token', 'key'];
    console.log('--- Buscando nombre de columna correcto ---');

    for (const v of variations) {
        console.log(`Probando columna: "${v}"...`);
        const payload: any = { name: 'Test', email: `test_${v}@test.com` };
        payload[v] = 'sk_test_123';

        const { error } = await supabase.from('api_clients').insert([payload]);

        if (!error) {
            console.log(`✅ ¡ÉXITO! La columna correcta es: "${v}"`);
            await supabase.from('api_clients').delete().eq('email', `test_${v}@test.com`);
            return v;
        } else {
            console.log(`❌ Falló con "${v}": ${error.message}`);
        }
    }
    console.log('❌ No se encontró ninguna columna válida.');
    return null;
}

findCorrectColumn();
