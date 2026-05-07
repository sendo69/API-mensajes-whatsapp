import { Router } from 'express';
import { handleEvolutionWebhook } from '../controllers/webhooks.controller';

const router = Router();

// Webhook de Evolution API (sin autenticación de API Key, es interno)
router.post('/evolution', handleEvolutionWebhook);

export default router;
