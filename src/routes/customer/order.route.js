import { Router } from "express";
import { customerController } from "../../controllers/customer/index.js";
import { bodyValidator } from "../../middlewares/common/index.js";
import { CustomerValidator } from "../../middlewares/customer/validator/index.js";
const router =  Router()
router.post("/create",[CustomerValidator.order.orderValidationRules,bodyValidator],customerController.order.orderCreate)
router.get('/my-orders',customerController.order.getMyOrders)
router.post('/retry-payment',customerController.order.retryPayment);
router.post('/payment-details',customerController.order.fetchPaymentDetails);
router.post('/my-orders/comments/add',customerController.order.commentsAdd)
router.get('/my-orders/stats',customerController.order.getMyOrderStats)
router.get('/my-orders/details/:orderId',customerController.order.getMySingleOrder)
router.get("/check-payment-status",customerController.order.checkOrderPaymentStatus)
router.post('/review/add',[CustomerValidator.order.orderReviewValidationRules,bodyValidator],customerController.order.reviewAdd)
export default router

