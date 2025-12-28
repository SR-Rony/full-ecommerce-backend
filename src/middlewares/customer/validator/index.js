import { customerLoginValidationRules, customerSignupValidationRules, resetPasswordValidationRules } from './auth.js';
import { ContactCreateValidationRules } from './contact.validator.js';
import { CustomerShippingAddressValidationRules } from './customerShippingAddress.validator.js';
import { orderReviewValidationRules, orderValidationRules } from './order.validator.js';
import { profileValidationRules } from './profile.validator.js';
export const CustomerValidator = {
  auth: {
    customerSignupValidationRules,
    customerLoginValidationRules,
    resetPasswordValidationRules
  },
  contact:{
    ContactCreateValidationRules
  },
  customerShippingAddress:{
    CustomerShippingAddressValidationRules
  },
  profile:{
    profileValidationRules
  },
  order:{
    orderValidationRules,
    orderReviewValidationRules
  }
};
