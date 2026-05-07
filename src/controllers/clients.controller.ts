import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import crypto from 'crypto';

/**
 * Registra un nuevo cliente y genera su API Key automáticamente.
 * Este es el punto de entrada para el Onboarding desde el SaaS.
 */
export const registerClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;

    if (!name) {
      res.status(400).json({ error: 'El nombre del cliente es obligatorio' });
      return;
    }

    // 1. Crear el Cliente
    const clientId = crypto.randomUUID();
    const { data: client, error: clientError } = await supabase
      .from('api_clients')
      .insert([{ 
        id: clientId, 
        name,
        whatsapp_status: 'disconnected'
      }])
      .select()
      .single();

    if (clientError) {
      console.error('Error al crear cliente:', clientError);
      res.status(500).json({ error: 'Error al crear el registro del cliente' });
      return;
    }

    // 2. Generar API Key segura
    // Formato: ak_ + 32 caracteres aleatorios
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const apiKey = `ak_${randomBytes}`;

    // 3. Guardar la API Key vinculada al cliente
    // Importante: Usamos 'key_hash' que es la columna que el middleware consulta
    const { error: keyError } = await supabase
      .from('api_keys')
      .insert([{
        client_id: clientId,
        key_hash: apiKey,
        is_active: true
      }]);

    if (keyError) {
      console.error('Error al crear API Key:', keyError);
      res.status(500).json({ error: 'Cliente creado pero fallo al generar la llave' });
      return;
    }

    // 4. Retornar credenciales
    res.status(201).json({
      message: 'Cliente registrado exitosamente',
      clientId: client.id,
      apiKey: apiKey,
      dashboardUrl: `http://localhost:3000/?apiKey=${apiKey}`
    });

  } catch (error) {
    console.error('Error en registerClient:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
