# Guía de Integración: SaaS Lavaderos ↔ API WhatsApp

Esta guía explica cómo conectar cualquier SaaS multi-cliente con la API de WhatsApp para lograr automatizaciones personalizadas por negocio.

---

## 1. Cambios en la Base de Datos (SaaS)
Para que cada negocio (tenant) tenga su propia configuración, añade estos campos a la tabla de **Configuración** o **Perfil de Negocio** de tu SaaS:

| Campo | Tipo | Descripción |
|---|---|---|
| `whatsapp_client_id` | UUID | ID único generado por la API de WhatsApp. |
| `whatsapp_api_key` | String | Llave de acceso al Dashboard y seguridad. |

---

## 2. Flujo de Onboarding (Registro Automático)
Cuando un nuevo negocio se registre en tu SaaS o decida activar el módulo de WhatsApp, el SaaS debe llamar a la API de WhatsApp para obtener sus credenciales.

**Endpoint:** `POST http://localhost:3000/api/v1/clients/register`  
**Payload:**
```json
{
  "name": "Nombre del Negocio"
}
```

**Acción:** Guarda el `clientId` y la `apiKey` que recibas en los campos creados en el Paso 1.

---

## 3. Envío de Señales (Webhook Triggers)
Para que la API sepa cuándo enviar mensajes, el SaaS debe enviar un "grito" (señal) cada vez que ocurra un evento importante (Crear Orden, Pago, Entrega, etc.).

**Endpoint dinámico:** `POST http://localhost:3000/api/v1/automations/capture/{whatsapp_client_id}`  
**Metodología:**
- No necesitas API Key para este endpoint (se identifica por el `clientId`).
- Envía un JSON con toda la información que quieras que el usuario use como variables.

**Ejemplo de señal de Pago:**
```json
{
  "evento": "pago_recibido",
  "monto": 50000,
  "cliente": {
    "nombre": "Juan Perez",
    "whatsapp": "3131234567"
  },
  "vehiculo": {
    "placa": "XYZ123",
    "modelo": "Mazda 3"
  }
}
```

---

## 4. Acceso al Dashboard de Configuración
Para que el dueño del lavadero configure sus propios mensajes, el SaaS debe ofrecer un botón o link en su panel administrativo.

**URL de Acceso:**
`http://localhost:3000/?apiKey={whatsapp_api_key}`

**Comportamiento esperado:**
- Al entrar con esa llave, el Dashboard solo mostrará las señales, reglas y plantillas de **ese** negocio específico.
- El usuario podrá usar el "Asistente de Señales" para ver el JSON que envió el SaaS y mapear sus variables visualmente.

---

## 5. Resumen de Flujo Lógico
1. **Registro:** El SaaS pide credenciales a la API → Las guarda.
2. **Operación:** El SaaS envía señales a la API en cada evento → La API evalúa reglas.
3. **Configuración:** El usuario entra al Dashboard → Crea sus plantillas y activa sus reglas.
4. **Ejecución:** La API envía el WhatsApp automáticamente cuando se cumple la regla.
