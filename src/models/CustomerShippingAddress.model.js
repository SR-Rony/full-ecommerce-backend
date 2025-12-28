import mongoose from 'mongoose'
const CustomerShippingAddressSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    email: {
      type: String,
      default: null
    },
    street: {
      type: String,
      default: null
    },
    streetNumber: {
      type: String,
      default: null
    },
    streetName: {
      type: String,
      default: null
    },
    aptUnit: {
      type: String,
      default: null
    },
    city: {
      type: String,
      default: null
    },
    state: {
      type: String,
      default: null
    },
    country: {
      label: {
        type: String,
        default:null
      },
      value: {
        type: String,
        default:null
      }
    },
    zipCode: {
      type: String,
      default: null
    },
    zip: {
      type: String,
      default: null
    },
    receiverName: {
      firstName: {
        type: String,
        default: null
      },
      lastName: {
        type: String,
        default: null
      },
      fullName: {
        type: String,
        default: null
      }
    },
    phone: {
      type: String,
      default: null
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    deleted: {
      type: Boolean,
      default: false
    },
    site:{
      type:String, //ex: hb,auctropin
      default:'hb'
    }
  },
  { timestamps: true, versionKey: false }
)

const CustomerShippingAddressModel = mongoose.model(
  'CustomerShippingAddress',
  CustomerShippingAddressSchema
)
export default CustomerShippingAddressModel
