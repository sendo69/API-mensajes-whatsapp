
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function checkLog() {
    const { data, error } = await supabase
        .from('webhook_logs')
        .select('payload')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) console.log('Error:', error);
    else console.log('Último Payload recibido:\n', JSON.stringify(data[0].payload, null, 2));
}

checkLog();
