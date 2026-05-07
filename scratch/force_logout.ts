
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
const EVOLUTION_API_URL = 'http://localhost:8080';

async function forceReset() {
    console.log('--- FORZANDO RESET DE INSTANCIA ---');
    
    // 1. Obtener la instancia del cliente
    const { data: clients } = await supabase.from('api_clients').select('id, whatsapp_instance').not('whatsapp_instance', 'is', null);
    
    if (!clients || clients.length === 0) {
        console.log('No hay instancias registradas en la base de datos.');
        return;
    }

    const client = clients[0]; // Asumimos que es el cliente principal
    const instanceName = client.whatsapp_instance;
    console.log(`Instancia encontrada: ${instanceName}`);

    // 2. Eliminar la instancia en Evolution API
    try {
        console.log('Cerrando sesión en Evolution...');
        await axios.delete(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
            headers: { apikey: process.env.EVOLUTION_GLOBAL_API_KEY }
        });
    } catch (e: any) {
        console.log('Error logout (ignorable):', e.message);
    }

    try {
        console.log('Eliminando instancia en Evolution...');
        await axios.delete(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
            headers: { apikey: process.env.EVOLUTION_GLOBAL_API_KEY }
        });
    } catch (e: any) {
        console.log('Error delete (ignorable):', e.message);
    }

    // 3. Limpiar en base de datos
    console.log('Limpiando base de datos...');
    await supabase.from('api_clients').update({ whatsapp_instance: null }).eq('id', client.id);

    console.log('✅ Reset completado. El usuario puede generar una nueva instancia.');
}

forceReset();
