import { Router } from "express";
import { customerController } from "../../controllers/customer/index.js";

const router =  Router()
router.get('/freebies',customerController.freeBuy.getAllFreeBies);
router.post('/',customerController.freeBuy.claimFreeBuyThresholdBy);
router.get('/monthly-freebies',customerController.freeBuy.getAllMonthlyFreeBies);
router.get('/threshold-ranges',customerController.freeBuy.getThresholdRanges);
export default router