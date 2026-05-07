import { Response, Request } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { supabase } from '../config/supabase';

/**
 * Crea una nueva plantilla para el cliente
 */
export const createTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clientId = req.clientData?.id;
    const { name, slug, content } = req.body;

    if (!name || !slug || !content) {
      return res.status(400).json({ error: 'Faltan campos: name, slug, content' });
    }

    const { data, error } = await supabase
      .from('message_templates')
      .insert([{
        client_id: clientId,
        name,
        slug,
        content
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creando plantilla:', error);
      return res.status(500).json({ error: 'Error al guardar la plantilla' });
    }

    res.status(201).json({ message: 'Plantilla creada con éxito', template: data });
  } catch (error) {
    res.status(500).json({ error: 'Error interno' });
  }
};

/**
 * Lista todas las plantillas del cliente
 */
export const getTemplates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clientId = req.clientData?.id;
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('client_id', clientId);

    if (error) return res.status(500).json({ error: 'Error al consultar plantillas' });

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error interno' });
  }
};

/**
 * Elimina una plantilla
 */
export const deleteTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clientId = req.clientData?.id;
    const { id } = req.params;

    const { error } = await supabase
      .from('message_templates')
      .delete()
      .eq('id', id)
      .eq('client_id', clientId);

    if (error) return res.status(500).json({ error: 'Error al eliminar plantilla' });

    res.status(200).json({ message: 'Plantilla eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error interno' });
  }
};

/**
 * Actualiza una plantilla existente
 */
export const updateTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clientId = req.clientData?.id;
    const { id } = req.params;
    const { name, slug, content } = req.body;

    if (!name || !slug || !content) {
      return res.status(400).json({ error: 'Faltan campos: name, slug, content' });
    }

    const { data, error } = await supabase
      .from('message_templates')
      .update({ name, slug, content })
      .eq('id', id)
      .eq('client_id', clientId)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando plantilla:', error);
      return res.status(500).json({ error: 'Error al actualizar la plantilla' });
    }

    res.status(200).json({ message: 'Plantilla actualizada con éxito', template: data });
  } catch (error) {
    res.status(500).json({ error: 'Error interno' });
  }
};
