import cors from 'cors';

import { customerController } from '../controllers/customer/index.js';
import { authMiddleware } from '../middlewares/index.js';
//customer routes
import { ErrorLog, errorHandlerNotify } from '../middlewares/common/errorMiddleware.js';
import { leakyBucketRateLimit } from '../middlewares/customer/rateLimit.js';
import CustomerAppInfoSettingsRoute from './customer/appInfoSetting.route.js';
import CustomerAuthRoute from './customer/auth.route.js';
import cacheClearRoute from './customer/cache.clean.route.js';
import CustomerCategoriesRoute from './customer/category.route.js';
import customerContactRoute from './customer/contact.route.js';
import customerContactCategoriesRoute from './customer/contactCategory.route.js';
import customerCouponsRoute from './customer/coupon.route.js';
import customerNotificationRoute from './customer/customerNotification.route.js';
import customerShippingAddressRoute from './customer/customerShippingAddress.route.js';
import customerFaqsRoute from './customer/faq.route.js';
import customerFreeBuyRoute from './customer/freeBuy.route.js';
import labTestedProductRoute from './customer/labTestedProducts.route.js';
import CustomerModalPopupsRoute from './customer/modalPopup.route.js';
import customerOrderRoute from './customer/order.route.js';
import CustomerProductsRoute from './customer/product.route.js';
import customerProfileRoute from './customer/profile.route.js';
import publicRoute from "./customer/public.route.js";

import { unsubscribeNotificationByEmail } from '../controllers/customer/customerNotification.controllers.js';
import customerShippingSettingRoute from './customer/shippingOptionSetting.route.js';
import customerTicketRoute from './customer/ticket.route.js';
import customerShippingRoute from './customer/shipping.route.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export const VersionRoute = (app) => {

   const corsOptions = {
      origin: process.env.CORS_URI && process.env.CORS_URI.split(',').filter(Boolean),
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true, // enable set cookie
   };
   app.use(cors(corsOptions));
   app.post(
     "/api/v1.0/customers/notifications/unsubscribe-by-email",
     unsubscribeNotificationByEmail,
   );
   //updateOrderStatus()
   //updateOrderRestrictOptions()
  //  updateCustomerPayoutAllowed()
  //  updateCustomerApproved_by_admin_at()
   //cache clear route
   app.use('/api/v1.0', cacheClearRoute)
   app.use('/api/v1.0/customers/auth/registration/field-check', customerController.appInfoSetting.getRegistrationFieldCheck);
   
   // Public endpoint to get customer info for refund request
   app.get(
     "/api/v1.0/customers/profile/request-credit-customer/:token",
     customerController.profile.getCustomerForRefund
   );
   
   // Public endpoint for submitting refund request
   app.post(
     "/api/v1.0/customers/profile/request-credit-refund",
     customerController.profile.requestCreditRefund
   );
   
   // now payment webhook url
   app.post("/api/orders/ipn", customerController.order.orderIPN);
   app.post("/api/v1.0/nowpayment/ipn",customerController.order.orderIPN);
   app.post("/api/v1.0/nowpayment/ipn-new/post", customerController.order.orderIPN);
   // BTCPay Server webhook url
   app.post("/api/v1.0/btcpay/webhook", customerController.order.orderIPN);

   //Rate Limit
   app.use(leakyBucketRateLimit)

   app.use("/api/v1.0/public", publicRoute);


   //customer auth route
   app.use('/api/v1.0/customers/auth', CustomerAuthRoute)

   //customer products route
   app.use('/api/v1.0/customers/products', CustomerProductsRoute)

   //customer products route
   app.use("/api/v1.0/customers/categories", CustomerCategoriesRoute)

   //customer modal-popups route
   app.use("/api/v1.0/customers/modal-popups", CustomerModalPopupsRoute)

   //customer app-info-settings route
   app.use("/api/v1.0/customers/setting/app-info", CustomerAppInfoSettingsRoute)

   //customer shipping-settings route
   app.use('/api/v1.0/customers/setting/shipping', customerShippingSettingRoute)

   //customer contact-category route
   app.use('/api/v1.0/customers/contact-categories', customerContactCategoriesRoute)

   //customer faqs
   app.use('/api/v1.0/customers/faqs', customerFaqsRoute)

   //customer contact 
   app.use('/api/v1.0/customers/contact', customerContactRoute)

   //customer address
   app.use('/api/v1.0/customers/shipping-address', authMiddleware.customer.isCustomerAuthorized, customerShippingAddressRoute)

   //customer profile route
   app.use('/api/v1.0/customers/profile', customerProfileRoute)

   //Customer Coupon route
   app.use('/api/v1.0/customers/coupons', customerCouponsRoute)

   //orders route
   app.use('/api/v1.0/customers/orders', authMiddleware.customer.isCustomerAuthorized, authMiddleware.customer.isCustomerAuthorized, customerOrderRoute)

   //free buy
   app.use('/api/v1.0/customers/claim-free-buy', authMiddleware.customer.isCustomerAuthorized, customerFreeBuyRoute)

   //customer notifications 
   app.use('/api/v1.0/customers/notifications', authMiddleware.customer.isCustomerAuthorized, customerNotificationRoute)

   //customers lab Tested Product routes
   app.use('/api/v1.0/customers/lab-tested-products', labTestedProductRoute)
   

   
   //customer tickets
   app.use('/api/v1.0/customers/tickets', customerTicketRoute)

   //customer shipping
   app.use('/api/v1.0/customers/shipping', customerShippingRoute)


   //global error handle 
   app.use([ErrorLog, errorHandlerNotify])
}
