import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_GLOBAL_API_KEY = process.env.EVOLUTION_GLOBAL_API_KEY || '';
const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'default_instance';

const evolutionClient = axios.create({
  baseURL: EVOLUTION_API_URL,
  headers: {
    'apikey': EVOLUTION_GLOBAL_API_KEY,
    'Content-Type': 'application/json'
  }
});

/**
 * Crea una nueva instancia en Evolution API
 */
export const createInstance = async (instanceName: string) => {
  try {
    const response = await evolutionClient.post('/instance/create', {
      instanceName: instanceName,
      token: '', 
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS'
    });

    // Registrar el webhook automáticamente para esta instancia
    const webhookUrl = process.env.BACKEND_WEBHOOK_URL;
    if (webhookUrl) {
      await evolutionClient.post(`/webhook/set/${instanceName}`, {
        url: webhookUrl,
        enabled: true,
        events: [
          "MESSAGES_UPSERT",
          "MESSAGES_UPDATE",
          "MESSAGES_DELETE",
          "SEND_MESSAGE",
          "CONNECTION_UPDATE"
        ]
      });
    }

    return { success: true, data: response.data };
  } catch (error: any) {
    console.error(`Error creando instancia ${instanceName}:`, error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
};

/**
 * Obtiene el QR de una instancia en formato Base64
 */
export const getInstanceQR = async (instanceName: string) => {
  try {
    const response = await evolutionClient.get(`/instance/connect/${instanceName}`);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error(`Error obteniendo QR de ${instanceName}:`, error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
};

/**
 * Consulta el estado de la conexión en Evolution API
 */
export const fetchInstanceStatus = async (instanceName: string) => {
  try {
    const response = await evolutionClient.get(`/instance/connectionState/${instanceName}`);
    return { success: true, data: response.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data || error.message };
  }
};

/**
 * Cierra sesión y elimina la instancia
 */
export const logoutInstance = async (instanceName: string) => {
  try {
    await evolutionClient.delete(`/instance/logout/${instanceName}`);
    await evolutionClient.delete(`/instance/delete/${instanceName}`);
    return { success: true };
  } catch (error: any) {
    console.error(`Error eliminando instancia ${instanceName}:`, error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
};

/**
 * Envía un mensaje de texto plano usando una instancia específica
 */
export const sendMessage = async (instanceName: string, number: string, text: string, retryCount = 0): Promise<any> => {
  try {
    const response = await evolutionClient.post(`/message/sendText/${instanceName}`, {
      number: number,
      options: {
        delay: 1200,
        presence: 'composing',
        linkPreview: false
      },
      textMessage: {
        text: text
      }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    const errorData = error.response?.data;
    const errorMessage = errorData?.response?.message || errorData?.message || error.message;

    // Si la conexión está cerrada en Evolution pero activa en el celular, forzamos un "despertar"
    if ((errorMessage === 'Connection Closed' || errorMessage.includes('close')) && retryCount < 1) {
      console.log(`🔌 [Auto-Fix] Conexión dormida en ${instanceName}. Enviando pulso de reconexión...`);
      
      try {
        // Al llamar a /connect, Evolution intenta restaurar el socket si tiene las credenciales
        await evolutionClient.get(`/instance/connect/${instanceName}`);
        
        // Esperamos 4 segundos para que WhatsApp Web (Baileys) se estabilice
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        console.log(`🔌 [Auto-Fix] Reintentando el envío del mensaje a ${number}...`);
        return await sendMessage(instanceName, number, text, retryCount + 1);
      } catch (reconnectError) {
        console.error(`❌ [Auto-Fix] Falló el intento de reconexión para ${instanceName}.`);
      }
    }

    console.error(`Error enviando mensaje por instancia ${instanceName}:`, errorData || error.message);
    return {
      success: false,
      error: errorData || error.message
    };
  }
};
