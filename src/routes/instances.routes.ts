import { Router } from 'express';
import { authenticateApiKey } from '../middlewares/auth.middleware';
import { initClientInstance, getClientQR, logoutClientInstance, getInstanceStatus } from '../controllers/instances.controller';

const router = Router();

// Todas las rutas de instancias requieren que el cliente se identifique con su X-API-Key
router.use(authenticateApiKey);

router.post('/init', initClientInstance);
router.get('/status', getInstanceStatus);
router.get('/qr', getClientQR);
router.post('/logout', logoutClientInstance);

export default router;
