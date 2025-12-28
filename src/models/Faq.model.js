import mongoose from "mongoose";
const FaqSchema = new mongoose.Schema({
    createdByAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
    },
    lastActionByAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
    },
    question: {
        type:String,
        required:[true,"Question is required!"]
    },
    answer: {
        type:String,
        required:[true,"Answer is required!"]
    },
    icon: {
        size: {
            type: String,
            default: "150px",
        },
        url: { type: String }
    },
    isActive: {
        type: Boolean,
        default: true
    }


}, { timestamps: true })

const FaqModel = mongoose.model('Faq', FaqSchema)
export default FaqModel