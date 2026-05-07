import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const EVOLUTION_API_URL = 'http://localhost:8080';

async function nukeAll() {
    console.log('--- DESTRUYENDO TODAS LAS INSTANCIAS ---');
    try {
        const { data: instances } = await axios.get(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
            headers: { apikey: process.env.EVOLUTION_GLOBAL_API_KEY }
        });
        
        console.log(`Encontradas ${instances.length} instancias en el motor.`);

        for (const inst of instances) {
            const name = inst.instance.instanceName;
            console.log(`Eliminando: ${name}...`);
            await axios.delete(`${EVOLUTION_API_URL}/instance/logout/${name}`, { headers: { apikey: process.env.EVOLUTION_GLOBAL_API_KEY } }).catch(() => {});
            await axios.delete(`${EVOLUTION_API_URL}/instance/delete/${name}`, { headers: { apikey: process.env.EVOLUTION_GLOBAL_API_KEY } }).catch(() => {});
            console.log(`✅ ${name} eliminada.`);
        }
        console.log('--- LIMPIEZA TOTAL COMPLETADA ---');
    } catch (e: any) {
        console.log('Error conectando a Evolution API:', e.message);
    }
}

nukeAll();
