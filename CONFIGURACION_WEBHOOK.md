# Guía de Integración: Conexión SaaS → API WhatsApp

Este documento detalla cómo configurar cualquier sistema externo (SaaS, CRM, App personalizada) para enviar señales automáticas a la API de mensajes.

## 🚀 1. Configuración del Endpoint
En el panel de administración de tu sistema externo, busca la sección de **Webhooks** o **Notificaciones HTTP** y configura lo siguiente:

| Campo | Valor Sugerido |
| :--- | :--- |
| **URL de Destino** | `http://[TU_DOMINIO_O_IP]:3000/api/v1/automations/capture/[TU_CLIENT_ID]` |
| **Método HTTP** | `POST` |
| **Tipo de Contenido** | `application/json` |

> **Nota:** Puedes obtener tu URL personalizada directamente desde el **Inspector de Señales** en el Dashboard.

---

## 📦 2. Estructura de los Datos (Payload)
La API es "Universal", lo que significa que acepta cualquier estructura de datos. Aquí tienes un ejemplo de lo que un SaaS de Lavadero enviaría típicamente:

```json
{
  "evento": "lavado_completado",
  "cliente": {
    "nombre": "Juan Pérez",
    "whatsapp": "573101234567"
  },
  "vehiculo": {
    "placa": "XYZ-987",
    "tipo": "Camioneta"
  },
  "pago": {
    "total": 35000
  }
}
```

---

## 🛠️ 3. Pasos para la Activación

### Paso A: El Envío de Prueba
Configura la URL y realiza una acción en tu SaaS que dispare el webhook.

### Paso B: El Inspector
Abre tu Dashboard de WhatsApp -> Sección **Automatizaciones**. Verás la señal recibida en el **Inspector**. Haz clic en ella para ver los nombres de los campos.

### Paso C: La Regla de Oro
Crea una **Nueva Regla** con estos detalles:
1.  **Origen:** Sistema Externo (Webhook).
2.  **Campo de Teléfono:** El nombre del campo en tu JSON (en el ejemplo de arriba sería `cliente.whatsapp`).
3.  **Mapeo de Plantilla:** Conecta las variables de tu mensaje con los campos del JSON (ej: `{{cliente}}` -> `cliente.nombre`).

---

## ⚠️ 4. Recomendaciones de Seguridad y Formato
1.  **Formato de Teléfono:** Asegúrate de enviar siempre el código de país (ej: `57` para Colombia).
2.  **Puerto:** Si usas un servidor propio, asegúrate de que el puerto `3000` sea accesible desde internet.
3.  **Notación de Puntos:** Si tus datos están anidados (como en el ejemplo de arriba), usa puntos para navegar: `objeto.subobjeto.campo`.

---
*Documento generado por Antigravity para el Sistema de Automatización de WhatsApp.*
