import { validationResult } from "express-validator";
import { responseError } from "../../utils/index.js";
import { logger } from "../../utils/logger.js";


export const bodyValidator = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      var message=""
      const errorMessages = errors.array().map((error,i) => {
       if(i==0){
        message=error?.msg;
       }
        return {
          
          [error.path]: error.msg
        };
      }); 
      // Log the validation errors
      logger.error(`Validation errors: ${JSON.stringify(errorMessages)}`);
      return res.status(400).json(responseError(message,errorMessages,400));
    }
    next();
};
  