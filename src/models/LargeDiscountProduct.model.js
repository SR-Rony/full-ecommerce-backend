import mongoose from "mongoose";

const discountProductSchema = new mongoose.Schema({

  largeDiscountProducts:[{
    type: mongoose.Schema.Types.ObjectId,
    ref:"Product"
  }],
  isActive:{
    type:Boolean,
    default:true
  },
  site:{
    type:String,
    default:"hb"
  }
 
}, {
  timestamps: true,
 
});

const LargeDiscountProductModel = mongoose.model('LargeDiscountProduct', discountProductSchema);
export default LargeDiscountProductModel;