import mongoose from "mongoose";

const LiveChatSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        default: null
    },
   
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    },
    email:{
        type:String,
        required:[true,"Email is required!"],
        lowercase:true,
        trim:true
        
    },
    firstName:{
        type:String,
        default:null
        
    },
    lastName:{
        type:String,
        default:null
        
    },
    issueType:{
        type:String,
        required:[true,"issueType is required!"],
        lowercase:true,
        trim:true

    },
    lastMessage:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LiveChatMessage',
        default: null
    },
    site:{
        type:String,
        enum:["hb","auctropin"],
        default:"hb"
    }
}, {
    timestamps: true,
    versionKey: false
});

const LiveChatModel = mongoose.model('LiveChat', LiveChatSchema);
export default LiveChatModel