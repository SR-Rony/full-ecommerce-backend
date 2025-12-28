import mongoose from 'mongoose';

const ShippingSettingSchema = new mongoose.Schema({
    createdByAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
    },
    lastActionByAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
    },
    shippingCountry: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ShippingCountry",
    },
    name: {
        type: String,
        required: [true, "name is required!"]
    },//"US Priority Shipping Cost"
    cost: {
        type: Number,
        float: true,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    arrivalNote: {
        type: String,
    },//Average of 2-7 days till arrival
    noteForCustomer: {
        type: String,
    },//NOTE: SHIPPING IS FREE IF SUBTOTAL IS $150.00+.
    freeShipping: {
        allow: {
            type: Boolean,
            default: true
        },//if shopping amount total equal or more than this amount
        amount: {
            type: Number,
            default: 0 //150 
        }
    },
    site:{
        type:String, //ex: hb,auctropin
        default:'hb'
      },

}, { timestamps: true })
const ShippingSettingModel = mongoose.model("ShippingOptionSetting", ShippingSettingSchema)
export default ShippingSettingModel;