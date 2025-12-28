import { Router } from "express";
import { customerController } from "../../controllers/customer/index.js";

const router = Router()
router.get('/', customerController.labTestedProduct.labTestedProductGet);
router.post('/track', customerController.labTestedProductTrack.labTestedProductTrackCreate);
export default router