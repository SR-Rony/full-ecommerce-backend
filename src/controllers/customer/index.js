/**
 * Controller module for handling customer-related operations.
 * @namespace customerController
 */

import { customerOrderReviewAndSendMailToAdmin } from '../../mail/emailHelpers.js'
import { appInfoSettingSingleLatestDetails,getRegistrationFieldCheck } from './appInfoSetting.controllers.js'
import { customerLogOut, customerLogin, customerSignup } from './auth.controllers.js'
import {
  categorySingleDetails,
  getPublicCategories
} from './category.controllers.js'
import { contactCreate, getCustomerContacts } from './contact.controllers.js'
import {
  contactCategorySingleDetails,
  getPublicContactCategories
} from './contactCategoryControllers.js'
import { getAllValidCoupons, getCouponByCode, updateCouponTotalUses } from './coupon.controllers.js'
import {
  customerShippingAddressCreateAndUpdate,
  customerShippingAddressGetDetails,
  customerShippingAddressSearch
} from './customerShippingAddress.controllers.js'
import { faqSingleDetails, getPublicFaqs } from './faq.controllers.js'
import { claimFreeBuyThresholdBy, getAllFreeBies, getAllMonthlyFreeBies, getThresholdRanges } from './freeBuy.controllers.js'
import { labTestedProductGet } from './labTestedProducts.controllers.js'
import { labTestedProductTrackCreate } from './labTestedProductTrack.controllers.js'
import {
  modalPopupSingleDetails
} from './modalPopup.controllers.js'
import {
  checkOrderPaymentStatus,
  commentsAdd,
  fetchPaymentDetails,
  getMyOrderStats,
  getMyOrders,
  getMySingleOrder,
  orderCreate,
  orderIPN,
  retryPayment,
  reviewAdd,
} from './order.controllers.js'
import {
  getBundleProducts,
  getNewProducts,
  getPublicProducts,
  productSingleDetails
} from './product.controllers.js'
import {
  getCreditBalance,
  getCustomerForRefund,
  getMyProfile,
  profileEmailLinkVerify,
  profileForgotPasswordLinkSend,
  profileMatchedPasswordReset,
  profileResendEmailOtpLinkSend,
  profileResetPasswordLinkVerify,
  profileUpdate,
  profileUpdateEmailLinkSend,
  profileUpdatePhoneNumber,
  requestCreditRefund,
  seenPrimoPage
} from './profile.controllers.js'
import { bundleAnalytic, getMinimumOrderAmount } from './public.controller.js'
import { shippingSettingSingleLatestOneDetails } from './shippingOptionSetting.controllers.js'

export const customerController = {
  auth: {
    customerLogin,
    customerSignup,
    customerLogOut
  },
  product: {
    productSingleDetails,
    getPublicProducts,
    getBundleProducts,
    getNewProducts
  },
  category: {
    categorySingleDetails,
    getPublicCategories
  },
  modalPopup: {
    modalPopupSingleDetails
  },
  appInfoSetting: {
    getRegistrationFieldCheck,
    appInfoSettingSingleLatestDetails
  },
  shippingOptionSetting: {
    shippingSettingSingleLatestOneDetails
  },
  contactCategory: {
    contactCategorySingleDetails,
    getPublicContactCategories
  },
  faq: {
    faqSingleDetails,
    getPublicFaqs
  },
  contact: {
    contactCreate,
    getCustomerContacts
  },
  customerShippingAddress: {
    customerShippingAddressCreateAndUpdate,
    customerShippingAddressGetDetails,
    customerShippingAddressSearch
  },
  profile: {
    profileUpdate,
    getMyProfile,
    profileForgotPasswordLinkSend,
    profileResetPasswordLinkVerify,
    profileMatchedPasswordReset,
    profileUpdateEmailLinkSend,
    profileEmailLinkVerify,
    profileResendEmailOtpLinkSend,
    profileUpdatePhoneNumber,
    getCreditBalance,
    getCustomerForRefund,
    requestCreditRefund,
    seenPrimoPage,
  },
  coupon: {
    getCouponByCode,
    updateCouponTotalUses,
    getAllValidCoupons,
  },
  order: {
    orderCreate,
    getMyOrders,
    getMySingleOrder,
    retryPayment,
    fetchPaymentDetails,
    orderIPN,
    getMyOrderStats,
    checkOrderPaymentStatus,
    commentsAdd,
    reviewAdd,
    customerOrderReviewAndSendMailToAdmin
  },
  freeBuy: {
    claimFreeBuyThresholdBy,
    getAllFreeBies,
    getAllMonthlyFreeBies,
    getThresholdRanges
  },
  public: {
    getMinimumOrderAmount,
    bundleAnalytic,
  },
  labTestedProduct: {
    labTestedProductGet,
  },
  labTestedProductTrack: {
    labTestedProductTrackCreate,
  },

}

