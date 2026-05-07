import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import messagesRoutes from './routes/messages.routes';
import webhooksRoutes from './routes/webhooks.routes';
import instancesRoutes from './routes/instances.routes';
import templatesRoutes from './routes/templates.routes';
import automationsRoutes from './routes/automations.routes';
import authRoutes from './routes/auth.routes';
import clientsRoutes from './routes/clients.routes';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(helmet({
  contentSecurityPolicy: false, // Necesario para cargar scripts externos en el dashboard
}));
app.use(cors());
app.use(express.json());

// Log global de peticiones para depuración
app.use((req, res, next) => {
  console.log(`📡 [${req.method}] ${req.url}`);
  next();
});

// Servir archivos estáticos del Dashboard
app.use(express.static(path.join(__dirname, '../public')));

// Ruta principal para el Dashboard
app.get('/', (req: Request, res: Response) => {
  const indexPath = path.join(__dirname, '../public/index.html');
  console.log(`🔍 Buscando Dashboard en: ${indexPath}`);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error(`❌ Error al enviar el Dashboard: ${err.message}`);
      res.status(500).send(`Error interno: No se encontró el Dashboard en ${indexPath}`);
    }
  });
});

// ===== RUTAS =====

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    service: 'WhatsApp SaaS API',
    version: '1.2.0',
    timestamp: new Date().toISOString()
  });
});

// Rutas de gestión de conexión (QR, vincular número)
app.use('/api/v1/instances', instancesRoutes);

// Rutas de plantillas
app.use('/api/v1/templates', templatesRoutes);

// Rutas de mensajes (protegidas por API Key)
app.use('/api/v1/messages', messagesRoutes);

// Rutas de autenticación
app.use('/api/v1/auth', authRoutes);

// Rutas de automatizaciones
app.use('/api/v1/automations', automationsRoutes);

// Rutas de clientes (Registro y Onboarding)
app.use('/api/v1/clients', clientsRoutes);

// Rutas de webhooks (llamadas internamente por Evolution API)
app.use('/api/v1/webhooks', webhooksRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 WhatsApp SaaS API corriendo en puerto ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`📨 Enviar mensaje: POST http://localhost:${PORT}/api/v1/messages/send`);
});
