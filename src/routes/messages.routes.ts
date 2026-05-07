import { Router } from 'express';
import { sendWhatsAppMessage } from '../controllers/messages.controller';
import { authenticateApiKey } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas de mensajes requieren autenticación de API Key
router.use(authenticateApiKey);

router.post('/send', sendWhatsAppMessage);

export default router;
