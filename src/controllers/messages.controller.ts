import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { sendMessage } from '../services/evolution.service';
import { supabase } from '../config/supabase';
import { normalizePhoneNumber, isValidPhoneNumber } from '../utils/phone.utils';

export const sendWhatsAppMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { number, text, templateSlug, templateId, params } = req.body;
    const clientId = req.clientData?.id;

    if (!number) {
      res.status(400).json({ error: 'El campo "number" es obligatorio' });
      return;
    }

    if (!clientId) {
      res.status(401).json({ error: 'Cliente no identificado' });
      return;
    }

    // 1. Obtener la instancia de WhatsApp asignada al cliente
    const { data: client, error: clientError } = await supabase
      .from('api_clients')
      .select('whatsapp_instance')
      .eq('id', clientId)
      .single();

    if (clientError || !client?.whatsapp_instance) {
      res.status(400).json({ error: 'El cliente no tiene una instancia de WhatsApp vinculada.' });
      return;
    }

    let finalMessage = text;

    // 2. Si se usa una plantilla, procesarla
    if (templateSlug || templateId) {
      let query = supabase.from('message_templates').select('content').eq('client_id', clientId);
      
      if (templateId) {
        query = query.eq('id', templateId);
      } else {
        query = query.eq('slug', templateSlug);
      }

      const { data: template, error: tError } = await query.single();

      if (tError || !template) {
        res.status(404).json({ error: `Plantilla no encontrada` });
        return;
      }

      // Reemplazar {{variable}} por los valores de params
      finalMessage = template.content;
      if (params) {
        Object.keys(params).forEach(key => {
          const placeholder = new RegExp(`{{${key}}}`, 'g');
          finalMessage = finalMessage.replace(placeholder, params[key]);
        });
      }
    }

    if (!finalMessage) {
      res.status(400).json({ error: 'No hay contenido para enviar. Provee "text" o "templateSlug"' });
      return;
    }

    // 3. Validar y normalizar número
    if (!isValidPhoneNumber(number)) {
      res.status(400).json({ error: 'Número inválido. Use formato: 573001234567' });
      return;
    }
    const normalizedNumber = normalizePhoneNumber(number);

    // 4. Enviar usando Evolution API
    const result = await sendMessage(client.whatsapp_instance, normalizedNumber, finalMessage);

    // 5. Registrar log
    await supabase.from('message_logs').insert([{
      client_id: clientId,
      phone_number: number,
      message_type: 'text',
      content: finalMessage,
      status: result.success ? 'sent' : 'failed',
      evolution_message_id: result.data?.key?.id || null,
      error_message: result.success ? null : JSON.stringify(result.error)
    }]);

    if (!result.success) {
      res.status(500).json({ error: 'Fallo al enviar mensaje', details: result.error });
      return;
    }

    res.status(200).json({ message: 'Mensaje enviado', messageId: result.data?.key?.id });
  } catch (error) {
    console.error('Error en sendWhatsAppMessage:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
