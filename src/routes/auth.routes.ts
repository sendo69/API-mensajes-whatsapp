import { Router, Response, Request } from 'express';
import { authenticateApiKey, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { supabase } from '../config/supabase';
import { randomUUID } from 'crypto';

const router = Router();
console.log('✅ Módulo de rutas de autenticación cargado');

// Registro de nuevo cliente
router.post('/register', async (req: Request, res: Response) => {
  console.log('--- INTENTO DE REGISTRO ---');
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      console.warn('⚠️ Datos incompletos:', { name, email });
      return res.status(400).json({ error: 'Nombre y email son obligatorios' });
    }

    const apiKey = `sk_${randomUUID().replace(/-/g, '')}`;
    console.log(`Intentando insertar cliente: ${name} (${email})`);
    
    // Paso 1: Crear el cliente (o recuperarlo si ya existe por email)
    const { data: existingClient } = await supabase
      .from('api_clients')
      .select()
      .eq('email', email)
      .single();

    let client = existingClient;
    let clientErr = null;

    if (!client) {
      console.log(`Creando nuevo cliente: ${name}`);
      const { data: newClient, error } = await supabase
        .from('api_clients')
        .insert([{ name, email }])
        .select()
        .single();
      client = newClient;
      clientErr = error;
    } else {
      console.log(`Cliente ya existe, usando existente: ${client.id}`);
    }

    if (clientErr) {
      console.error('❌ Error al crear cliente:', clientErr);
      return res.status(500).json({ error: 'Error al crear cliente', details: clientErr.message });
    }

    // Paso 2: Obtener o crear API Key
    let finalApiKey = apiKey;
    const { data: existingKey } = await supabase
      .from('api_keys')
      .select('key')
      .eq('client_id', client.id)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (existingKey) {
      finalApiKey = existingKey.key;
      console.log('Usando API Key existente');
    } else {
      console.log('Generando nueva API Key');
      const { error: keyErr } = await supabase
        .from('api_keys')
        .insert([{ 
          client_id: client.id, 
          key: apiKey, 
          is_active: true 
        }]);

      if (keyErr) {
        console.error('❌ Error al crear API Key:', keyErr);
        return res.status(500).json({ error: 'Error al generar API Key', details: keyErr.message });
      }
    }

    console.log('✅ Registro procesado exitosamente para:', name);
    res.json({ ...client, api_key: finalApiKey });
  } catch (err: any) {
    console.error('💥 Error inesperado en /register:', err);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: err.message || String(err)
    });
  }
});

router.get('/me', authenticateApiKey as any, (req: AuthenticatedRequest, res: Response) => {
  res.json(req.clientData);
});

export default router;
