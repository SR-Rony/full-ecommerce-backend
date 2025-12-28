import OrderModel from "../src/models/Order.model.js";

export const updateOrderStatus = async () => {
    console.log("updateOrderStatus=> old order update paymentMethod 'nowpayments' initiated")
  const res = await OrderModel.updateMany(
        { "payment.paymentMethod": { $exists: false } },
        { $set: { "payment.paymentMethod": "nowpayments" } },
        { new: true }
    );
    console.log("updateOrderStatus=> old order update paymentMethod 'nowpayments' completed",res)
}
