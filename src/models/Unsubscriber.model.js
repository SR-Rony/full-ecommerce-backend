import mongoose from "mongoose";

const UnsubscriberSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
       email:{
        type:String,
        default:null // if customer is logged in to use null
       },
       isBulkMailSubscribe:{
        type:Boolean,
        default:false
       },
       site: {
        type: String, //ex: hb,auctropin
        default: 'hb',
        lowercase:true
    }
    },
    { timestamps: true,versionKey:false }
);
const UnsubscriberModel = mongoose.model("Unsubscriber", UnsubscriberSchema)

export default UnsubscriberModel