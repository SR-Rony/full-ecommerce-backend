import { Router } from "express";
import { customerController } from "../../controllers/customer/index.js";
import { CustomerValidator } from "../../middlewares/customer/validator/index.js";
import { bodyValidator } from "../../middlewares/common/index.js";
import { authMiddleware } from "../../middlewares/index.js";


const router = Router()
router.post('/',[CustomerValidator.contact.ContactCreateValidationRules,bodyValidator], customerController.contact.contactCreate)

router.get('/',authMiddleware.customer.isCustomerAuthorized, customerController.contact.getCustomerContacts)



export default router;