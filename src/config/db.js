import mongoose from 'mongoose';
import ShippingCountryModel from '../models/Setting/ShippingCountry.model.js';
import { redis } from '../utils/helpers.js';
import { logger } from '../utils/index.js';
import CONFIG from './index.js';
import ProductModel from '../models/Product.model.js';

export  const redisClient =  redis

export const MongooseConnectionInstance= () =>{
mongoose.connect(CONFIG.DB.MONGODB.MONGODB_URI)
  .then(async () => {

// const shippingOptionSetting = await ShippingCountryModel.findOne({})
// await ProductModel.updateMany({"site":"auctropin"},{
  
//   "availability.countries":[shippingOptionSetting._id],
//   "availability.isInternational":false,

// },{new:true})


    logger.info('MongoDB Database connected successfully!');
  })
  .catch((error) => {
    console.error(error)
    logger.error('MongoDB Database connection failed!');
  });

}

