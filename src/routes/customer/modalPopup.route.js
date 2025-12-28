import { Router } from "express";
import { customerController } from "../../controllers/customer/index.js";

const router = Router()

router.get('/details',customerController.modalPopup.modalPopupSingleDetails)

export default router;