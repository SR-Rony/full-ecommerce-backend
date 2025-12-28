
import jwt from "jsonwebtoken";
import { redisClient } from "../../config/db.js";
import CONFIG from "../../config/index.js";
import { Constants } from "../../mail/constants.js";
import CustomerModel from "../../models/Customer.model.js";
import { responseError } from '../../utils/index.js';
import { logger } from '../../utils/logger.js';
export const isPublicAuth = async (req, _res, next) => {
  try {
    const bearer = req.headers.authorization
    const token = bearer&&bearer.split(' ')[1] || ''
    const decodeCustomer= jwt.verify(token, CONFIG.JWT.JWT_SECRET)

    const customerId =  decodeCustomer?._id
    redisClient.get(`customer_auth_token_${customerId}`).then((_value)=>{
      req.customer =decodeCustomer
      if(decodeCustomer?._id){
        if (decodeCustomer?.isEmailInvalid == true) {
          return _res.status(400).json({
            success: false,
            code: 400,
            redirectTo:Constants.redirectTo,
            emailInvalidReason:decodeCustomer?.emailInvalidReason,
            email:decodeCustomer?.email,
            customerId:decodeCustomer?._id,
            message:"Your current email is invalid/not reachable, please update your email to your one of operational email in order to use H&B and get updates.",
          });
        }
      }
      next()
  })
  .catch((error)=>{
    console.log(error)
    const errorRes = responseError('Customer Authorization Failed!',401)
    next()
  })
  } catch (err) {
   next()
  }
}
export const isCustomerAuthorized = async (req, res, next) => {
  try {
    const bearer = req.headers.authorization;

    if (!bearer) {
      const errorRes = responseError('Authentication token not provided!');
      return res.status(401).json(errorRes);
    }

    const token = bearer.split(' ')[1] || '';

    if (!token) {
      const errorRes = responseError('Authentication token not provided!');
      return res.status(401).json(errorRes);
    }

    const decodeCustomer = jwt.verify(token, CONFIG.JWT.JWT_SECRET);

    const customerId = decodeCustomer?._id;

 

    redisClient.get(`customer_auth_token_${customerId}`).then((value) => {
      const parseToken = jwt.verify(value, CONFIG.JWT.JWT_SECRET);

      if (parseToken?.isBlocked == true) {
        return res.status(401).json(responseError('Your account is suspended',  401));
      }
  
      if (parseToken?.isEmailVerified == false) {
        return res.status(401).json(responseError('Please verify your email!', 401));
      }
      if (parseToken?.isEmailInvalid == true) {
        return res.status(400).json({
          success: false,
          code: 400,
          redirectTo:Constants.redirectTo,
          emailInvalidReason:parseToken?.emailInvalidReason,
          email:parseToken?.email,
          customerId:parseToken?._id,
          message:"Your current email is invalid/not reachable, please update your email to your one of operational email in order to use H&B and get updates.",
        });
      }

      if (!parseToken?._id &&parseToken?._id?.toString()  !== customerId?.toString()) {
        return res.status(401).json(responseError('Customer Authorization Failed',  401));
      }

      const today = new Date().toDateString();

      // Check if lastActivityAt needs to be updated in MongoDB (only if not already updated today)
      const lastActivityDate = decodeCustomer?.activity?.lastActivityAt && new Date(decodeCustomer?.activity?.lastActivityAt).toDateString();

      if (!lastActivityDate || lastActivityDate !== today) {
        // Update lastActivityAt and lastLoginAt in MongoDB
        CustomerModel.findByIdAndUpdate(customerId, {
          'activity.lastActivityAt': new Date(),
        }, { new: true });

        // Set Customer in Redis with updated lastActivityAt and lastLoginAt
        const updatedCustomer = {
          ...decodeCustomer,
          activity: {
            ...(decodeCustomer.activity||{}),
            lastActivityAt: new Date(),
          },
        };
        redisClient.set(`customer_auth_token_${customerId?.toString()}`, JSON.stringify(updatedCustomer));

        // Set Customer in the request
        req.customer = updatedCustomer;
      } else {
        // Set Customer in the request without updating lastActivityAt and lastLoginAt
        req.customer = decodeCustomer;
      }

      next();
    }).catch((error) => {
      console.log(error);
      const errorRes = responseError('Customer Authorization Failed!',  401);
      return res.status(401).json(errorRes);
    });
  } catch (err) {
    const errorRes = responseError('Customer Authorization Failed!',  401);
    logger.error(err.message);
    return res.status(401).json(errorRes);
  }
};
