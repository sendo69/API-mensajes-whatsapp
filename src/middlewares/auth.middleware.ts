import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

// Extendemos el Request de Express para guardar la info del cliente autenticado
export interface AuthenticatedRequest extends Request {
  clientData?: {
    id: string;
    name: string;
  };
}

export const authenticateApiKey = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const apiKey = req.header('X-API-Key') || req.query.apiKey;

    if (!apiKey) {
      res.status(401).json({ error: 'Missing API Key' });
      return;
    }

    // Buscamos la API Key en la tabla dedicada
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('client_id, is_active')
      .eq('key_hash', apiKey)
      .single();

    if (keyError || !keyData) {
      res.status(401).json({ error: 'Invalid API Key' });
      return;
    }

    if (!keyData.is_active) {
      res.status(403).json({ error: 'API Key is disabled' });
      return;
    }

    // Obtenemos los datos del cliente
    const { data: clientData, error: clientError } = await supabase
      .from('api_clients')
      .select('id, name')
      .eq('id', keyData.client_id)
      .single();

    if (clientError || !clientData) {
      res.status(403).json({ error: 'Client not found or inactive' });
      return;
    }

    // Guardamos la info del cliente en el objeto Request
    req.clientData = {
      id: clientData.id,
      name: clientData.name
    };

    next();
  } catch (error) {
    console.error('Auth Error:', error);
    res.status(500).json({ error: 'Internal Server Error during authentication' });
  }
};
