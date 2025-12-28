import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisClient } from "../../config/db.js";
import { responseError } from '../../utils/func.js';

// Middleware to implement leaky bucket rate limiting
export const leakyBucketRateLimit = rateLimit({
    // Rate limiter configuration
    windowMs: 60 * 1000, // 1 minute
    max: process.env.RATE_LIMIT_REQUEST_PER_MINUTE, // Limit each IP to request per 1-minute window
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Redis store configuration
    store: new RedisStore({
		sendCommand: (...args) => redisClient.call(...args),
	}),
    handler: (req, res,next) => {
        console.log("verify rate limiting",req.headers)
        if(req.headers['x-nowpayments-sig']) {
            console.log("nowpayment request received.")
            return next();
        }
       return res.status(429).json(responseError('Too Many Requests',409));
    }
});
