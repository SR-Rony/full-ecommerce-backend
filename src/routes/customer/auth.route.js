import { customerController } from "../../controllers/customer/index.js";
import { CustomerValidator } from "../../middlewares/customer/validator/index.js";


import { Router } from 'express';
import { bodyValidator } from "../../middlewares/common/bodyValidator.js";
import { authMiddleware } from "../../middlewares/index.js";

const router = Router()
router.post('/login', [CustomerValidator.auth.customerLoginValidationRules, bodyValidator], customerController.auth.customerLogin)

router.post('/signup', [CustomerValidator.auth.customerSignupValidationRules, bodyValidator], customerController.auth.customerSignup)

router.post('/logout/:userId',authMiddleware.customer.isCustomerAuthorized,customerController.auth.customerLogOut)
export default router;