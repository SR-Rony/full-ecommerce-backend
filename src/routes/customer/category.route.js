import { Router } from "express";
import { customerController } from "../../controllers/customer/index.js";
const router =  Router()
router.get("/",customerController.category.getPublicCategories)
router.get('/details/:slug',customerController.category.categorySingleDetails)
export default router