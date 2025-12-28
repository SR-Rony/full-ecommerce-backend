import { Router } from "express";
import { customerController } from "../../controllers/customer/index.js";

const router = Router()

router.get('/',customerController.contactCategory.getPublicContactCategories)

router.get('/details/:_id',customerController.contactCategory.contactCategorySingleDetails)


export default router;