import { Router } from 'express';
import { registerClient } from '../controllers/clients.controller';

const router = Router();

/**
 * @route POST /api/v1/clients/register
 * @desc Registra un nuevo negocio y genera sus credenciales
 */
router.post('/register', registerClient as any);

export default router;
