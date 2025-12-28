import { Router } from "express";
import { customerController } from "../../controllers/customer/index.js";

const router = Router()
router.get('/',customerController.faq.getPublicFaqs)

router.get('/details/:_id',customerController.faq.faqSingleDetails)



export default router;