import { Router } from "express";
import { customerController } from "../../controllers/customer/index.js";

const router = Router()

router.get('/',customerController.shippingOptionSetting.shippingSettingSingleLatestOneDetails)


export default router;