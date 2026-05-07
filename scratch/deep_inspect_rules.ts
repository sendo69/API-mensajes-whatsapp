
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function deepInspect() {
    console.log('--- Inserción con table_name y event_type ---');
    const { data, error } = await supabase
        .from('automation_rules')
        .insert([{ 
            name: 'Test', 
            table_name: 'EXTERNAL', 
            event_type: 'WEBHOOK',
            phone_column: 'phone',
            mapping: {},
            client_id: '00000000-0000-0000-0000-000000000000'
        }])
        .select();

    if (error) {
        console.log('❌ Error:', error.message);
    } else {
        console.log('✅ Columnas:', Object.keys(data[0]));
    }
}

deepInspect();
