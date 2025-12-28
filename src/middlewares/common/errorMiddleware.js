import { logger, responseError } from "../../utils/index.js";


export const ErrorLog = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.status = 404;
    res.status(404)
    next(error);
};
export const errorHandlerNotify = async (err, req, res, next) => {
    if (err.name === "ValidationError") {
        const errors = {};
        let message=""
         Object.values(err.errors).map((val,i) => {
            if(i==0){
                message=val.message;
            }
            errors[val.path] = val.message
        });
        return res.status(400).json(responseError(message,[errors],400));
    } else {
        if (err.status === 404) {
            logger.error(err.message)
            return res.status(404).json(responseError('Not Found 404!',[],404))    
        }
    logger.error(err.message || err)
      return res.status(500).json(responseError(err.message || err,[],400));
    }
}