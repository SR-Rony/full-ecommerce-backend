import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Please login!'],
  },
  message: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  info: {
    type: { type: String },//order,others,orderComment
    uriCode:{type: String},
  },
  site: {
    type: String, //ex: hb,auctropin
    default: 'hb'
}
}, {
  timestamps: true,
});

const NotificationModel = mongoose.model('Notification', notificationSchema);
export default NotificationModel