import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import * as evolutionService from '../services/evolution.service';
import { supabase } from '../config/supabase';

/**
 * Inicializa una instancia para el cliente autenticado.
 */
export const initClientInstance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clientId = req.clientData?.id;
    if (!clientId) return res.status(401).json({ error: 'Cliente no identificado' });

    const { data: client } = await supabase
      .from('api_clients')
      .select('whatsapp_instance')
      .eq('id', clientId)
      .single();

    if (!client) return res.status(500).json({ error: 'Error al consultar datos del cliente' });

    let instanceName = client.whatsapp_instance;

    if (!instanceName) {
      instanceName = `client_${clientId.split('-')[0]}`;
      await supabase.from('api_clients').update({ whatsapp_instance: instanceName }).eq('id', clientId);
    }

    const result = await evolutionService.createInstance(instanceName);
    res.status(200).json({ message: 'Proceso iniciado', instanceName });
  } catch (error) {
    console.error('Error en initClientInstance:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

/**
 * Obtiene el código QR para que el cliente lo escanee en su panel.
 */
export const getClientQR = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clientId = req.clientData?.id;
    const { data: client } = await supabase.from('api_clients').select('whatsapp_instance').eq('id', clientId).single();

    if (!client?.whatsapp_instance) return res.status(400).json({ error: 'Inicializa la instancia primero' });

    const result = await evolutionService.getInstanceQR(client.whatsapp_instance);
    if (!result.success) return res.status(500).json({ error: 'No se pudo obtener el QR', details: result.error });

    res.status(200).json(result.data);
  } catch (error) {
    res.status(500).json({ error: 'Error interno al obtener QR' });
  }
};

/**
 * Obtiene el estado real de la conexión de la instancia
 */
export const getInstanceStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clientId = req.clientData?.id;
    const { data: client } = await supabase.from('api_clients').select('whatsapp_instance').eq('id', clientId).single();

    if (!client?.whatsapp_instance) return res.json({ instance: { state: 'DISCONNECTED' } });

    const result = await evolutionService.fetchInstanceStatus(client.whatsapp_instance);
    res.json(result.data || { instance: { state: 'DISCONNECTED' } });
  } catch (error) {
    res.json({ instance: { state: 'DISCONNECTED' } });
  }
};

/**
 * Desconecta el WhatsApp del cliente y elimina la instancia.
 */
export const logoutClientInstance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clientId = req.clientData?.id;
    const { data: client } = await supabase.from('api_clients').select('whatsapp_instance').eq('id', clientId).single();

    if (!client?.whatsapp_instance) return res.status(404).json({ error: 'No hay instancia activa' });

    const result = await evolutionService.logoutInstance(client.whatsapp_instance);
    res.status(result.success ? 200 : 500).json({ message: result.success ? 'Desconectado' : 'Error al cerrar sesión' });
  } catch (error) {
    res.status(500).json({ error: 'Error interno' });
  }
};
