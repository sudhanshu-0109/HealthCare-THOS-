import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { checkRole } from '../middleware/checkRole.js';
import * as userController from '../controllers/user.controller.js';

const router = Router();

router.use(authenticate, checkRole('SUPER_ADMIN'));
router.get('/', userController.getUsers);

export default router;
