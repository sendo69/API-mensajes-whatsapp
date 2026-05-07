import { Response, Request } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { supabase } from '../config/supabase';
import { sendWhatsAppMessage } from './messages.controller';

/**
 * Crea una nueva regla de automatización
 */
export const createAutomationRule = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clientId = req.clientData?.id;
    const { name, table_name, event_type, template_id, phone_column, mapping } = req.body;

    const { data, error } = await supabase
      .from('automation_rules')
      .insert([{
        client_id: clientId,
        name,
        table_name,
        event_type,
        template_id,
        phone_column,
        mapping,
        is_active: true
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error Supabase (automation_rules):', error);
      return res.status(500).json({ error: 'Error en base de datos', details: error.message });
    }
    res.status(201).json(data);
  } catch (err: any) {
    console.error('💥 Error inesperado en createAutomationRule:', err);
    res.status(500).json({ error: 'Error interno', details: err.message || err });
  }
};

/**
 * PROCESADOR DE WEBHOOKS DE SUPABASE
 * Esta ruta es la que se configura en el Webhook de Supabase
 */
export const processSupabaseWebhook = async (req: Request, res: Response) => {
  try {
    const { table, type, record } = req.body; // Formato estándar de Supabase Webhook
    
    // 1. Buscar si hay una regla activa para esta tabla y evento
    const { data: rules, error } = await supabase
      .from('automation_rules')
      .select('*, api_clients(api_key)')
      .eq('table_name', table)
      .eq('event_type', type)
      .eq('is_active', true);

    if (error || !rules || rules.length === 0) {
      return res.status(200).json({ message: 'No hay reglas para este evento' });
    }

    // 2. Procesar cada regla encontrada
    for (const rule of rules) {
      const phoneNumber = record[rule.phone_column];
      
      // Construir el objeto params basado en el mapeo
      const params: any = {};
      const mapping = rule.mapping as Record<string, string>;
      
      for (const [templateVar, tableColumn] of Object.entries(mapping)) {
        params[templateVar] = record[tableColumn] || '';
      }

      // 3. Ejecutar el envío (Simulamos un AuthenticatedRequest)
      const fakeReq: any = {
        clientData: { id: rule.client_id },
        body: {
          number: phoneNumber,
          templateId: rule.template_id,
          params: params
        }
      };

      await sendWhatsAppMessage(fakeReq, {
        status: () => ({ json: () => {} }),
        json: () => {}
      } as any);
    }

    res.status(200).json({ status: 'processed', rules_count: rules.length });
  } catch (error) {
    console.error('Error procesando automatización:', error);
    res.status(500).json({ error: 'Internal Error' });
  }
};

export const getAutomationRules = async (req: AuthenticatedRequest, res: Response) => {
    const clientId = req.clientData?.id;
    const { data, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('client_id', clientId);
    
    if (error) return res.status(500).json({ error: 'Error' });
    res.json(data);
};

/**
 * CAPTURADOR DE SEÑALES (Inspector + Motor)
 * Recibe cualquier JSON y dispara la automatización si hay una regla
 */
export const captureWebhook = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;
    const payload = req.body;
    
    // 0. Verificar si el cliente existe, si no, CREARLO automáticamente
    let { data: client } = await supabase
      .from('api_clients')
      .select('id')
      .eq('id', clientId)
      .single();

    if (!client) {
      console.log(`[Capture] 🆕 Registrando nuevo cliente automático: ${clientId}`);
      const { data: newClient, error: createError } = await supabase
        .from('api_clients')
        .insert([{ id: clientId, name: 'Nuevo Cliente SaaS', email: 'saas_auto@service.com' }])
        .select()
        .single();
      
      if (createError) {
        console.error(`[Capture] ❌ Error al auto-registrar cliente:`, createError);
      } else {
        client = newClient;
      }
    }

    // 1. Guardar en el log (Inspector)
    const { error: logError } = await supabase.from('webhook_logs').insert([{
        client_id: clientId,
        payload: payload,
        headers: req.headers
    }]);

    if (logError) {
      console.error(`[Capture] ❌ Error al guardar log en base de datos:`, logError);
    } else {
      console.log(`[Capture] 🎯 Señal guardada con éxito para cliente: ${clientId}`);
    }

    // 2. Buscar reglas "Externas" para este cliente
    const { data: rules } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('client_id', clientId)
      .eq('table_name', 'EXTERNAL') // Usamos 'EXTERNAL' para disparadores universales
      .eq('is_active', true);

    if (rules && rules.length > 0) {
      console.log(`[Capture] 🔍 Encontradas ${rules.length} reglas activas para el cliente ${clientId}.`);
      for (const rule of rules) {
        const mapping = (rule.mapping || {}) as any;

        // Evaluar Condición de Activación (Trigger)
        if (mapping._trigger) {
          const actualValue = getValueByPath(payload, mapping._trigger.path);
          if (String(actualValue) !== String(mapping._trigger.value)) {
            console.log(`[Capture] 🛑 Saltando regla '${rule.name}'. Condición fallida: esperado '${mapping._trigger.value}' en '${mapping._trigger.path}', pero se recibió '${actualValue}'.`);
            continue;
          } else {
            console.log(`[Capture] ✅ Condición cumplida para '${rule.name}': ${mapping._trigger.path} == ${mapping._trigger.value}`);
          }
        }

        // Extraer teléfono usando el mapeo (soporta notación de puntos: data.user.phone)
        const phoneNumber = getValueByPath(payload, rule.phone_column);
        console.log(`[Capture] 📱 Evaluando regla '${rule.name}'. Columna tel: '${rule.phone_column}', Valor extraído: '${phoneNumber}'`);
        
        if (!phoneNumber) {
           console.log(`[Capture] ⚠️ Saltando regla '${rule.name}' porque no se encontró número de teléfono.`);
           continue;
        }

        // Construir variables del mensaje
        const params: any = {};
        for (const [templateVar, path] of Object.entries(mapping as Record<string, string>)) {
          if (templateVar !== '_trigger') {
            params[templateVar] = getValueByPath(payload, path) || '';
          }
        }
        console.log(`[Capture] 🧩 Variables mapeadas para la plantilla:`, params);

        // Enviar mensaje
        const fakeReq: any = {
          clientData: { id: clientId },
          body: {
            number: phoneNumber,
            templateId: rule.template_id,
            params: params
          }
        };

        console.log(`[Capture] 🚀 Ejecutando sendWhatsAppMessage para ${phoneNumber}...`);
        await sendWhatsAppMessage(fakeReq, {
          status: (code: number) => {
            console.log(`[Capture] 📬 sendWhatsAppMessage finalizó con status HTTP: ${code}`);
            return { json: (data: any) => console.log(`[Capture] 📄 Detalle de respuesta:`, data) };
          },
          json: (data: any) => console.log(`[Capture] 📄 Detalle de respuesta:`, data)
        } as any);
      }
    } else {
      console.log(`[Capture] ℹ️ No hay reglas EXTERNAL activas para el cliente ${clientId}.`);
    }

    res.status(200).json({ message: 'Señal procesada' });
  } catch (error) {
    console.error('❌ ERROR AL PROCESAR WEBHOOK:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

/**
 * Función auxiliar para obtener valores de un objeto usando una ruta (ej: "cliente.datos.tel")
 */
function getValueByPath(obj: any, path: string) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

export const getWebhookLogs = async (req: AuthenticatedRequest, res: Response) => {
    const clientId = req.clientData?.id;
    const { data, error } = await supabase
      .from('webhook_logs')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) return res.status(500).json({ error: 'Error' });
    res.json(data);
};

export const deleteAutomationRule = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    await supabase.from('automation_rules').delete().eq('id', id);
    res.json({ message: 'Deleted' });
};

export const updateAutomationRule = async (req: AuthenticatedRequest, res: Response) => {
    const clientId = req.clientData?.id;
    const { id } = req.params;
    const { name, table_name, event_type, phone_column, mapping, template_id, is_active } = req.body;

    const { data, error } = await supabase
        .from('automation_rules')
        .update({ name, table_name, event_type, phone_column, mapping, template_id, is_active })
        .eq('id', id)
        .eq('client_id', clientId)
        .select()
        .single();

    if (error) {
        console.error('Error actualizando regla:', error);
        return res.status(500).json({ error: 'Error al actualizar' });
    }

    res.json({ message: 'Regla actualizada', rule: data });
};
