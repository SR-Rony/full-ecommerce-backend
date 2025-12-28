import { Router } from "express";
import { customerController } from "../../controllers/customer/index.js";
import { authMiddleware } from "../../middlewares/index.js";
const router = Router()

router.get('/minimum-order-amount',authMiddleware.customer.isCustomerAuthorized,customerController.public.getMinimumOrderAmount);
router.post('/bundle-clicks',authMiddleware.customer.isCustomerAuthorized,customerController.public.bundleAnalytic);

export default router;