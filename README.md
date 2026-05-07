# WhatsApp SaaS API Wrapper 🚀

API potente y escalable para gestionar múltiples instancias de WhatsApp (Evolution API) de forma sencilla. Diseñada para integrarse con sistemas SaaS como Lavaderos, Parqueaderos, Apps de Préstamos y más.

## 🏗️ Arquitectura
- **Backend:** Node.js + Express + TypeScript
- **Base de Datos:** Supabase (PostgreSQL)
- **WhatsApp Engine:** [Evolution API](https://evolution-api.com/)
- **Contenedores:** Docker + Docker Compose
- **Multi-tenancy:** Aislamiento por cliente mediante API Keys y nombres de instancia dinámicos.
- **Motor de Automatización:** Captura universal de webhooks con envío automático de mensajes.

---

## 🚦 Guía de Inicio Rápido

### 1. Requisitos
- Docker y Docker Compose.
- Proyecto de Supabase activo.
- Node.js v18+.

### 2. Variables de Entorno (.env)
```env
PORT=3000
SUPABASE_URL=tu_url_supabase
SUPABASE_SERVICE_KEY=tu_service_key
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_GLOBAL_API_KEY=tu_global_key
BACKEND_WEBHOOK_URL=http://tu-dominio.com/api/v1/webhooks
```

### 3. Levantar el Sistema
```bash
docker-compose up --build -d
```
Esto inicia todos los servicios: la API Wrapper, Evolution API, Redis y PostgreSQL.

### 4. Acceder al Dashboard
Abre `http://localhost:3000` en tu navegador. Desde ahí puedes:
- Vincular tu WhatsApp escaneando un QR.
- Crear plantillas de mensajes.
- Configurar automatizaciones visuales.
- Inspeccionar señales entrantes de sistemas externos.

---

## 📡 Referencia de Endpoints (v1)

### 🔐 Autenticación
Todas las peticiones (excepto Webhooks y Captura) requieren el header:
`X-API-Key: tu_api_key`

### 📱 Gestión de Instancias
| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `POST` | `/api/v1/instances/init` | Inicializa la instancia del cliente |
| `GET` | `/api/v1/instances/qr` | Obtiene el QR de vinculación |
| `POST` | `/api/v1/instances/logout` | Cierra sesión y elimina la instancia |

### 📝 Plantillas (Templates)
| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `POST` | `/api/v1/templates` | Crea una plantilla con variables `{{nombre}}` |
| `GET` | `/api/v1/templates` | Lista todas las plantillas del cliente |
| `DELETE` | `/api/v1/templates/:id` | Elimina una plantilla |

### 📨 Mensajería
| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `POST` | `/api/v1/messages/send` | Envía un mensaje directo o por plantilla |

**Ejemplo con plantilla:**
```json
{
  "number": "573001234567",
  "templateSlug": "carro_listo",
  "params": {
    "nombre": "Andrés",
    "placa": "XYZ-123"
  }
}
```

### 🤖 Automatizaciones
| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `POST` | `/api/v1/automations` | Crea una regla de automatización |
| `GET` | `/api/v1/automations` | Lista las reglas del cliente |
| `DELETE` | `/api/v1/automations/:id` | Elimina una regla |
| `POST` | `/api/v1/automations/capture/:clientId` | **Captura señales externas** (no requiere API Key) |
| `GET` | `/api/v1/automations/logs` | Consulta señales capturadas |

---

## 🔗 Motor de Automatización Universal

El sistema permite conectar **cualquier aplicación externa** para disparar mensajes de WhatsApp automáticamente sin necesidad de código.

### ¿Cómo funciona?
1. **Conectar:** Tu sistema externo (Lavadero, Shopify, CRM) envía un `POST` con datos JSON a la URL de captura.
2. **Inspeccionar:** El Dashboard muestra los datos recibidos para que identifiques los campos (ej: `cliente.whatsapp`, `vehiculo.placa`).
3. **Mapear:** Creas una regla que conecta los campos de la señal con las variables de tu plantilla de mensaje.
4. **Automatizar:** Cada nueva señal dispara el envío del WhatsApp automáticamente.

### Ejemplo de señal externa
```json
POST /api/v1/automations/capture/tu-client-id
Content-Type: application/json

{
  "evento": "lavado_completado",
  "cliente_nombre": "Carlos Pérez",
  "celular": "573101234567",
  "placa": "ABC-123",
  "valor": 35000
}
```

> 📖 Para más detalles, consulta el archivo [CONFIGURACION_WEBHOOK.md](./CONFIGURACION_WEBHOOK.md).

---

## 🗄️ Tablas de Supabase

| Tabla | Descripción |
| :--- | :--- |
| `api_clients` | Clientes registrados con sus API Keys |
| `message_templates` | Plantillas de mensajes con variables `{{...}}` |
| `message_logs` | Historial de mensajes enviados |
| `webhook_logs` | Señales capturadas desde sistemas externos |
| `automation_rules` | Reglas de automatización configuradas |

---

## 🔄 Webhooks Forwarding
Si el cliente tiene configurada una `webhook_url` en la tabla `api_clients`, la API le reenviará eventos de:
- `messages.update`: Cambios de estado (entregado, leído).
- `connection.update`: Estado de la conexión del WhatsApp.

---

## 🛠️ Desarrollo
```bash
npm run dev       # Servidor en modo desarrollo con auto-reload
npm run build     # Compila TypeScript a JavaScript
npm start         # Ejecuta la versión compilada
```

Para aplicar cambios en el backend dentro de Docker:
```bash
docker-compose up --build -d
```

---

## 📁 Estructura del Proyecto
```
├── public/
│   └── index.html          # Dashboard visual (SPA)
├── src/
│   ├── config/
│   │   └── supabase.ts     # Conexión a Supabase
│   ├── controllers/
│   │   ├── automations.controller.ts   # Motor de automatización
│   │   ├── messages.controller.ts      # Envío de mensajes
│   │   └── webhooks.controller.ts      # Procesamiento de webhooks
│   ├── middleware/
│   │   └── auth.middleware.ts          # Validación de API Keys
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── automations.routes.ts
│   │   └── messages.routes.ts
│   └── index.ts            # Entry point de Express
├── docker-compose.yml
├── Dockerfile
├── CONFIGURACION_WEBHOOK.md
└── README.md
```

---
Creado por **Antigravity AI** para Proyectos SaaS.
