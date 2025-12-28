import mongoose from "mongoose";
const LiveChatOptionSchema = new mongoose.Schema({
    createdByAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
    },
    lastActionByAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
    },
  
    name: {
        type: String,
        required: [true, "Name is required!"],
        trim:true,
        lowercase:true
    },
    isActive:{
        type:Boolean,
        default:true
    },
    orderNum:{
        type:Number,
        default:0
    }
}, { timestamps: true })

const LiveChatOptionSettingModel = mongoose.model('LiveChatOptionSetting', LiveChatOptionSchema)
export default LiveChatOptionSettingModel