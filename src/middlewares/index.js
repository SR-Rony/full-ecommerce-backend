import { isCustomerAuthorized, isPublicAuth } from './customer/isUserAuthorized.js';
/**
 * Middleware object for authentication-related middleware functions.
 * @namespace
 * @property {Object} customer - Middleware functions for customer authentication.
 * @property {function} customer.isPublicAuth - Function to check if a customer is authorized for public access.
 * @property {function} customer.isCustomerAuthorized - Function to check if a customer is authorized.
 */

export const authMiddleware = {
  customer: {
    isPublicAuth,
    isCustomerAuthorized,
  },
};
