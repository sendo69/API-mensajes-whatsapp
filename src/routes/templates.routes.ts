import { Router } from 'express';
import { authenticateApiKey } from '../middlewares/auth.middleware';
import { createTemplate, getTemplates, deleteTemplate, updateTemplate } from '../controllers/templates.controller';

const router = Router();

router.use(authenticateApiKey);

router.post('/', createTemplate);
router.get('/', getTemplates);
router.delete('/:id', deleteTemplate);
router.put('/:id', updateTemplate);

export default router;
