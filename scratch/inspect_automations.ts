
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function inspectAutomations() {
    console.log('--- Inspeccionando Columnas de automation_rules ---');
    const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Error al acceder a automation_rules:', error.message);
    } else {
        console.log('✅ Tabla accesible. Columnas:', data[0] ? Object.keys(data[0]) : 'Tabla vacía (intentando inserción mínima...)');
        if (!data[0]) {
             const { data: insData, error: insError } = await supabase
                .from('automation_rules')
                .insert([{ name: 'Inspector' }])
                .select();
             if (insError) {
                 console.log('❌ Error en inserción mínima:', insError.message);
             } else {
                 console.log('✅ Columnas encontradas:', Object.keys(insData[0]));
                 await supabase.from('automation_rules').delete().eq('id', insData[0].id);
             }
        }
    }
}

inspectAutomations();
