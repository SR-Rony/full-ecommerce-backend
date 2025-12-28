import { Router } from 'express'
import { customerController } from '../../controllers/customer/index.js'
import { bodyValidator } from '../../middlewares/common/bodyValidator.js'
import { CustomerValidator } from '../../middlewares/customer/validator/index.js'
import { authMiddleware } from '../../middlewares/index.js'
const router = Router()
router.get("/credit-balance",authMiddleware.customer.isCustomerAuthorized,customerController.profile.getCreditBalance);
router.get(
  '/',
  authMiddleware.customer.isCustomerAuthorized,
  customerController.profile.getMyProfile
)
router.put(
  '/',
  authMiddleware.customer.isCustomerAuthorized,
  customerController.profile.profileUpdate
)
router.post(
  '/forgot-password/send',
  [CustomerValidator.profile.profileValidationRules],
  customerController.profile.profileForgotPasswordLinkSend
)
router.patch(
  '/reset-password/verify',
  [CustomerValidator.auth.resetPasswordValidationRules, bodyValidator],
  customerController.profile.profileResetPasswordLinkVerify
)
router.patch(
  '/change-password',
  [CustomerValidator.auth.resetPasswordValidationRules, bodyValidator],
  authMiddleware.customer.isCustomerAuthorized,
  customerController.profile.profileMatchedPasswordReset
)
router.post(
  '/email-change-request/send',
  customerController.profile.profileUpdateEmailLinkSend
)
router.post(
  '/resend-otp-request/send',
  customerController.profile.profileResendEmailOtpLinkSend
)
router.patch('/email-verify', customerController.profile.profileEmailLinkVerify)

router.put(
  '/phone-number-update',
  authMiddleware.customer.isCustomerAuthorized,
  customerController.profile.profileUpdatePhoneNumber
)

router.post(
  '/seen-primo',
  authMiddleware.customer.isCustomerAuthorized,
  customerController.profile.seenPrimoPage
)
export default router
