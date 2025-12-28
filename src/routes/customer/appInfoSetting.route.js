import { Router } from "express";
import { customerController } from "../../controllers/customer/index.js";
const router = Router()

router.get('/',customerController.appInfoSetting.appInfoSettingSingleLatestDetails)


export default router;