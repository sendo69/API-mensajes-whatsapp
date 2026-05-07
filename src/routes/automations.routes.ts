import { Router } from 'express';
import { 
  createAutomationRule, 
  getAutomationRules, 
  deleteAutomationRule,
  updateAutomationRule,
  processSupabaseWebhook,
  captureWebhook,
  getWebhookLogs
} from '../controllers/automations.controller';
import { authenticateApiKey } from '../middlewares/auth.middleware';

const router = Router();

// Endpoint público para capturar señales (Cualquier sistema)
router.post('/capture/:clientId', captureWebhook);

// Endpoint público para Supabase
router.post('/process', processSupabaseWebhook);

// Endpoints privados para el Dashboard
router.get('/', authenticateApiKey as any, getAutomationRules as any);
router.get('/logs', authenticateApiKey as any, getWebhookLogs as any);
router.post('/', authenticateApiKey as any, createAutomationRule as any);
router.delete('/:id', authenticateApiKey as any, deleteAutomationRule as any);
router.put('/:id', authenticateApiKey as any, updateAutomationRule as any);

export default router;
