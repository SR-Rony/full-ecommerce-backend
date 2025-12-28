import mongoose from "mongoose";

export const CustomerNotificationTypeEnum = {
    ORDER_PAID: "ORDER_PAID",
    ORDER_PACKED: "ORDER_PACKED",
    ORDER_PARTIALLY_SHIPPED: "ORDER_PARTIALLY_SHIPPED",
    ORDER_FULLY_SHIPPED: "ORDER_FULLY_SHIPPED",
    ORDER_NEW_COMMENTS: "ORDER_NEW_COMMENTS"
};
const CustomerNotificationSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required:[true,"CustomerId is required!"]
    },

    msgTemplate: {
        type: String,
        required: [true, "Message is required!"]
    },

    type: {
        type: String,
        enum: Object.values(CustomerNotificationTypeEnum),
        required: [true, "Invalid enum type!"]
    },

    meta: {
        orderId: {
            type: String,
            default: null
        }
    },

    isDisplay: {
        type: Boolean,
        default: true
    },


}, { timestamps: true, versionKey: false })

const CustomerNotificationModel = mongoose.model('CustomerNotification', CustomerNotificationSchema)

export default CustomerNotificationModel;