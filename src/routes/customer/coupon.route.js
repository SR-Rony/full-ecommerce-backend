import { Router } from "express";
import { customerController } from "../../controllers/customer/index.js";

const router = Router();

router.post('/matched',customerController.coupon.getCouponByCode)
router.get("/coupons",customerController.coupon.getAllValidCoupons);
router.patch("/total-uses-count/:couponId",customerController.coupon.updateCouponTotalUses)
export default router