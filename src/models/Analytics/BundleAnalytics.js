import mongoose from "mongoose";

const BundleAnalyticSchema = new mongoose.Schema({
  originalProduct: {
    bundleSize: {
      type: Number,
      default: 0,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
      required: true,
    }
  },
  offerProduct: {
    bundleSize: {
      type: Number,
      default: 0,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
      required: true,
    }
  },
  totalAccepted: {
    type: Number,
    default: 0,
  },
  totalNotAccepted: {
    type: Number,
    default: 0,
  },
  date: {
    type: String,
    default: null,
    required: true,
  },
  site:{
    type:String,//ex:hb,auctropin
    default:'hb',
    lowercase:true
  }
}, { timestamps: true });

const BundleAnalyticModel = mongoose.model("BundleAnalytic", BundleAnalyticSchema)

export default BundleAnalyticModel