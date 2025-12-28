import mongoose from "mongoose";



const mediaSchema = new mongoose.Schema({
    name: {
        type: String
    },
    format: {
        type: String,
    },
    resource_type: {
        type: String,
    },
    bytes: {
        type: Number,
    },
    url: {
        type: String
    },
}, { timestamps: false, versionKey: false, _id: false })

const LiveChatMessageSchema = new mongoose.Schema({
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
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LiveChat",
        required: [true, 'Please select a chat!']
    },
    message: {
        type: String,
        default: null
    },
    media: [mediaSchema],
    isRead: {
        type: Boolean,
        default: false,
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
LiveChatMessageSchema.path('media').default([]);
const LiveChatMessageModel = mongoose.model('LiveChatMessage', LiveChatMessageSchema);

export default LiveChatMessageModel