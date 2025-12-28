import { Router } from "express";
import { customerNotificationHide, getCustomerNotifications, subscribeNotification, unsubscribeNotification } from "../../controllers/customer/customerNotification.controllers.js";

const router = Router();
router.get('/',getCustomerNotifications)
router.post('/hide/:_id',customerNotificationHide)
router.post('/subscribe/:_id',subscribeNotification)
router.post('/unsubscribe/:_id',unsubscribeNotification)
export default router