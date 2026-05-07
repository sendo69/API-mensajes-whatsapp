import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

/**
 * Recibe webhooks de Evolution API.
 * Evolution envía eventos cuando:
 * - Un mensaje cambia de estado (entregado, leído)
 * - Se recibe un mensaje nuevo
 * - El dispositivo se desconecta
 * 
 * Este endpoint NO requiere autenticación por API Key
 * ya que lo llama Evolution de forma interna dentro del VPS.
 */
export const handleEvolutionWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = req.body;

    // Ignorar eventos que no nos interesan
    if (!event || !event.event) {
      res.status(200).json({ received: true });
      return;
    }

    const eventType = event.event;
    const instanceName = event.instance;

    // 1. Obtener datos del cliente para este evento
    const { data: client } = await supabase
      .from('api_clients')
      .select('id, webhook_url')
      .eq('whatsapp_instance', instanceName)
      .single();

    switch (eventType) {
      case 'messages.update': {
        // Actualizar el estado de un mensaje (entregado, leído, etc.)
        const messageId = event.data?.key?.id;
        const status = mapEvolutionStatus(event.data?.status);

        if (messageId && status) {
          await supabase
            .from('message_logs')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('evolution_message_id', messageId);
        }
        break;
      }

      case 'connection.update': {
        const state = event.data?.state;
        console.log(`📱 Instancia [${instanceName}] cambió a estado: ${state}`);
        
        if (instanceName) {
          const dbStatus = state === 'open' ? 'connected' : 'disconnected';
          await supabase
            .from('api_clients')
            .update({ whatsapp_status: dbStatus })
            .eq('whatsapp_instance', instanceName);
        }
        break;
      }

      default:
        // Log opcional para otros eventos
        break;
    }

    // 2. Reenvío de Webhook al Cliente (Forwarding)
    if (client?.webhook_url) {
      // Enviamos el evento de forma asíncrona para no bloquear a Evolution
      fetch(client.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: eventType,
          instance: instanceName,
          data: event.data,
          timestamp: new Date().toISOString()
        })
      }).catch(err => console.error(`⚠️ Fallo al reenviar webhook a ${client.webhook_url}:`, err.message));
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error procesando webhook de Evolution:', error);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
};

/**
 * Mapea los códigos de estado internos de WhatsApp/Evolution a nuestros estados legibles
 */
const mapEvolutionStatus = (statusCode: number | undefined): string | null => {
  switch (statusCode) {
    case 2: return 'delivered'; // Entregado (doble check gris)
    case 3: return 'read';      // Leído (doble check azul)
    case 4: return 'played';    // Reproducido (para audios/videos)
    default: return null;
  }
};
