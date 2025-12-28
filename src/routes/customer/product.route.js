import { Router } from "express";
import { customerController } from "../../controllers/customer/index.js";
const router =  Router()
router.get("/",customerController.product.getPublicProducts)
router.get("/bundle-products",customerController.product.getBundleProducts);
router.get("/new-products",customerController.product.getNewProducts);
router.get("/details/:slug",customerController.product.productSingleDetails)
export default router