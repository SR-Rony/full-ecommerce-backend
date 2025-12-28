import moment from "moment";
import { CustomerNotificationClass } from "../../classes/CustomerNotification/customer.notification.class.js";
import { notifySocketAdmin } from "../../classes/notifyAdminSocket.js";
import { customerControllerMessages } from "../../common/index.js";
import { siteType } from "../../config/constant.js";
import { redisClient } from "../../config/db.js";
import { redisCacheVariable } from "../../config/redisCacheVariable.js";
import { AuctropinCustomerMailController } from "../../mail/auctropinIndex.js";
import { Constants } from "../../mail/constants.js";
import { CustomerMailController } from "../../mail/index.js";
import AdminModel from "../../models/Admin.model.js";
import CouponModel from "../../models/Coupon.model.js";
import CustomerModel from "../../models/Customer.model.js";
import CustomerNotificationModel, { CustomerNotificationTypeEnum } from "../../models/CustomerNotification.model.js";
import CustomerShippingAddressModel from "../../models/CustomerShippingAddress.model.js";
import FreeBuyModel from "../../models/FreeBuy.model.js";
import NotificationModel from "../../models/Notification.model.js";
import OrderModel from "../../models/Order.model.js";
import ProductModel from "../../models/Product.model.js";
import ShippingSettingModel from "../../models/Setting/ShippingOptionSetting.model.js";
import { checkBTCPayPaymentStatus, createBTCPayPaymentRequest, verifyBTCPayWebhook } from "../../utils/btcpay.js";
import { isValidArray, isValidDate } from "../../utils/func.js";
import {
  generateUniqueForOrderId,
  isCouponValid
} from "../../utils/helpers.js";
import {
  addressConcat,
  findWithPagination,
  responseError,
  responseSuccess,
} from "../../utils/index.js";
import { createPaymentForOrder } from "../../utils/nowpayment.js";
import { calculateSubTotalAmountWithShippingCostAndCouponProductsDiscount, validProducts } from "../../utils/orderFunc.js";
import { modifyCouponCodePercentage } from "./coupon.controllers.js";
import CreditHistory from "../../models/CreditHistory.model.js";



async function calculateAndSaveProductsTotalAmounts(order) {
  let coupon = null;
  if (order.orderSummary?.coupon?.coupon) {
    coupon = await CouponModel.findOne({ _id: order.orderSummary?.coupon?.coupon });
  }
  for (let product of order.products) {
    product.totalAmount = (parseFloat(product.price?.sale) * product.quantity);
    if (coupon) {
      if ((coupon.enableAllProducts && !coupon.excludeProducts.map((e) => e.toString()).includes(product.product?.toString())) || (!coupon.enableAllProducts && coupon.products.map((e) => e.toString()).includes(product.product.toString()))) {
        product.totalAmount = product.totalAmount - product.totalAmount * (coupon.value / 100);
      }
    }
    product.totalAmount = parseFloat(product.totalAmount).toFixed(2);
  }
  await order.save();
}


export const orderCreate = async (req, res, next) => {
  try {

    if (!req?.body?.site) {
      req.body['site'] = 'hb'
    }
    req.body["customer"] = req?.customer?._id;
    req.body["isTestOrder"] = req?.customer?.isTestCustomer??false;
    if(!req?.body?.paymentMethod){
      req.body.paymentMethod = 'btcpay';
    }
    // if(req?.body?.site=='auctropin'){
    //   req.body["isTestOrder"]=true;
    // }
    
    const customerExist = await CustomerModel.findOne({ _id: req?.customer?._id }).lean()
    if (!customerExist?._id) return res.status(400).json(responseError(customerControllerMessages.order.orderCreate.customerNotFound))
    const { products, shipping } = req.body;
    if (!shipping?.phoneNum) {
      req.body.shipping['phoneNum'] = req?.customer?.phone?.number
    }
    if (!req?.customer?.email) {
      req.body.shipping['email'] = req?.customer?.email
    }


    let cartsProducts = products;
    // console.log(req.body)
    const productValidationObj = {
      cartsProducts: [],
      dbProducts: [],
      couponProductsArr: [],
      freeShippingCost: 0,
      shippingCost: 0,
      couponPercent: 0,
      selectedShippingOption: {}
    };
    //shipping option exist checking start
    const shippingOptionExist = await ShippingSettingModel.findOne({
      _id: req?.body?.shipping?.shippingOptionSetting,
    }).populate([{ path: 'shippingCountry', select: {} }]).lean();
    if (!shippingOptionExist?._id) {
      await redisClient.del(redisCacheVariable.appInfo + siteType._hb)
      await redisClient.del(redisCacheVariable.appInfo + siteType._auctropin)
      await redisClient.del(redisCacheVariable.appCategories)
      await redisClient.del(redisCacheVariable.homeCategories)
      return res
        .status(400)
        .json(
          responseError(
            customerControllerMessages.order.orderCreate
              .shippingOptionSettingNotFound
          )
        );
    }
    productValidationObj["freeShippingCost"] =
      shippingOptionExist?.freeShipping?.amount || 0;
    productValidationObj["shippingCost"] = shippingOptionExist?.cost || 0;
    //shipping option exist checking end
    productValidationObj['selectedShippingOption'] = shippingOptionExist?.shippingCountry?.country || {}
    //products exist checking start
    if (!isValidArray(cartsProducts)) {
      return res
        .status(400)
        .json(
          responseError(
            customerControllerMessages.order.orderCreate.productNotFound
          )
        );
    }
    const bodyProductIds = cartsProducts
      .map((pd) => pd?.product)
      .filter(Boolean);
    



    const productsRestrictOutStocks = [
      "6499b7c8702c5c4c55259a8b",
      "666c33d4b7d8c6b4f53a1251"
    ];

    // Check customer eligibility
    const [databaseCustomer, orderCount] = await Promise.all([
      CustomerModel.findOne({
        _id: req?.customer?._id,
        createdAt: { $lt: new Date("2025-01-01") }
      }).select("createdAt _id").lean(),
      
      OrderModel.countDocuments({
        customer: req?.customer?._id,
        status: { $nin: ["CANCELLED", "PENDING", "FAILED"] },
        "payment.isPaymentCompleted": true,
        isTestOrder: false
      })
    ]);
    for(let p of bodyProductIds) {
      if(!(databaseCustomer && orderCount>=2) && productsRestrictOutStocks.includes(p)) {
        const product = await ProductModel.findOne({_id: p});
        return res
        .status(400)
        .json(
          responseError(
             `${product.title} is out of stock, please remove this product from your cart and then place your order.`
          )
        );
      }
    }

    const dbProducts = await ProductModel.find(
      { _id: { $in: bodyProductIds }, isSoldOut: false },
      { _id: 1, price: 1 }
    ).populate([
      {
        path: "availability.countries",
        select: {}
      },
    ]).select("availability price _id site").lean();

    if (!isValidArray(dbProducts)) {
      return res
        .status(400)
        .json(
          responseError(
            customerControllerMessages.order.orderCreate.productNotFound
          )
        );
    }
    productValidationObj["cartsProducts"] = cartsProducts.filter((pd) => {
      return dbProducts.some((dbP) => dbP?._id?.toString() == pd?.product?.toString());
    });

    req.body['products'] = productValidationObj["cartsProducts"]
    cartsProducts = productValidationObj["cartsProducts"]

    productValidationObj["dbProducts"] = dbProducts;
    //products exist checking end

    if (
      req?.body?.orderSummary?.coupon?.coupon
    ) {

      try {
        let coupon = await CouponModel.findOneAndUpdate(
          { _id: req?.body?.orderSummary?.coupon?.coupon },
          { $inc: { totalUses: 1 } },
          { new: true }
        ).lean();
        if (!coupon?.code) {
          return res.status(400).json(responseError("Coupon not exist!"));
        }
        console.log("coupon",coupon)
        console.log("req?.customer?._id",req?.customer?._id)
        coupon = modifyCouponCodePercentage(req?.customer?._id, coupon)

        const result = await isCouponValid(coupon, cartsProducts, false);
        if (!result.success) {
          return res.status(400).json(responseError(result.message));
        }
        productValidationObj["couponPercent"] = coupon?.value || 0;
        productValidationObj["couponProductsArr"] = coupon?.products || [];
        productValidationObj["enableAllProducts"] = coupon?.enableAllProducts || false;
        productValidationObj["excludeProducts"] = coupon?.excludeProducts || [];
      } catch (error) {
        console.log(error);
        return res.status(400).json(responseError("The coupon has expired.!"));
      }
    } else {
      productValidationObj["enableAllProducts"] = false;
    }
    // console.log(productValidationObj)
    const calculationOrder =
      calculateSubTotalAmountWithShippingCostAndCouponProductsDiscount(
        productValidationObj

      );

    let frontAmount = parseFloat(req?.body?.orderSummary?.totalAmount);
    let validAmount = parseFloat(calculationOrder?.finalAmount);

    console.log("front amount=", frontAmount);
    console.log("backend amount=", validAmount);

    if (frontAmount.toFixed(2) !== validAmount.toFixed(2)) {
      return res
        .status(400)
        .json(
          responseError(
            customerControllerMessages.order.orderCreate.amountError
          )
        );
    }

    try {
      req.body["orderId"] = await generateUniqueForOrderId({
        customerId: req?.customer?._id,
        email: req?.customer?.email,
      });
    } catch (e) {
      return res
        .status(400)
        .json(
          responseError(
            customerControllerMessages.order.orderCreate.orderIdGenError
          )
        );
    }
    req.body["tracking.numbers"] = []
    req.body["statusUpdatedAtRecords"] = [
      { status: req.body?.status || "PENDING", updatedAt: new Date() },
    ];

    // ******WARNING*****: must validate order_summary(total amount etc..) here. otherwise user can send lower total amount.
    req.body['products'] = validProducts(dbProducts, cartsProducts, productValidationObj?.selectedShippingOption);

    console.log("Creating order.", req.body)
    if (req.body.freeBuy?.freeBuyId) {
      const free = await FreeBuyModel.findOne({ _id: req.body.freeBuy.freeBuyId }).populate({
        path:"freeProducts",
        select:{},
        populate:[
          {
            path:"details.includes.product",
            select:{},
          },
          {
            path:"bundle.products",
            select:{},
          }
        ],
      }).lean();
      if (free) {
        const freeProduct = free.freeProducts.filter((e) => e._id.toString() == req.body.freeBuy?.productId?.toString())[0]
        if (freeProduct) {

          const cycleIncludes = freeProduct?.cycle?.isCycle === true && isValidArray(freeProduct?.details?.includes) ? freeProduct?.details?.includes.filter((fl) => {
            return fl?.product?.site === req?.body?.site
          }).map((item) => {
            return {
              product: item?.product?._id,
              title: item?.product?.title||item?.title,
              quantity: item?.quantity || 1,
              price: item?.product?.price,
              dosage: item?.dosage || ""
            }
          }) : []
         
          req.body.freeBuy.freeBuyProduct = {
            product: freeProduct?._id,
            title: freeProduct.title,
            quantity: 1,
            price: freeProduct.price,
            subTitle: freeProduct?.subTitle,
            bundle: {
              isBundle: freeProduct?.bundle?.isLimited,
              bundleProducts: isValidArray(freeProduct?.bundle?.products) ? freeProduct?.bundle?.products.filter(item =>item?.site== req.body.site).map(item => (item?._id)) : [],
              bundleSize:freeProduct?.bundle?.size
            },
            cycle: {
              isCycle:freeProduct?.cycle?.isCycle,
              cycleIncludes: cycleIncludes
            }
          };
        }
      }
    }


    req.body.origin = req.origin; // assign origin.


    const remainingBalance = (parseFloat(customerExist.availableCreditBalance)||0) - parseFloat(req.body.orderSummary.totalAmount);
    if(remainingBalance > -25 && remainingBalance < 0) {
      return res
        .status(402)
        .json(
          responseError(
            "After using credit balance, remaning amount to pay is not enough cover btc minimum amount to send.",
            402
          )
        );
    }

    const data = await OrderModel.create(req.body);

    await calculateAndSaveProductsTotalAmounts(data);

    console.log("Order created.")

    data["customer"] = req.customer;


    //console.log(req.customer)
    const shippingInfo = await CustomerShippingAddressModel.findOne({
      customer: data?.customer?._id,
    }).lean();
    if (data) {
      shippingInfo["fullAddress"] = addressConcat(shippingInfo);
      ///await CustomerMailController.order.sendNewOrderMail({ shippingInfo, order: data })
    }
    // console.log("orderSummary", data.orderSummary);

    let paymentDetails;

    let fullPaidWithCredit = false;
    if(remainingBalance<0) {
      if (req.body.paymentMethod === 'btcpay') {
        paymentDetails = await createBTCPayPaymentRequest(
          data.orderId,
          Math.abs(remainingBalance),
        );
      } else {
        // Default to NowPayments
        paymentDetails = await createPaymentForOrder(
          data.orderId,
          Math.abs(remainingBalance),
        );
      }

      if (!paymentDetails) {
        return res
          .status(402)
          .json(
            responseError(
              customerControllerMessages.order.orderCreate.paymentError,
              402
            )
          );
      }

      data.payment.paymentId = paymentDetails?.payment_id || paymentDetails?.paymentId;
      data.payment.paymentCreatedAt = new Date();
      data.payment.paymentMethod = req.body.paymentMethod || 'nowpayments';
      data.payment.usedCreditAmount = parseFloat(customerExist.availableCreditBalance) || 0;
      await data.save();
    } else {
      // mark order as paid.
      data.status = "PAID";
      data.statusUpdatedAtRecords = data.statusUpdatedAtRecords || [];
      data.statusUpdatedAtRecords.push({
        status: "PAID",
        updatedAt: new Date(),
      });
      data.payment.isPaymentCompleted = true;
      data.payment.usedCreditAmount = parseFloat(data.orderSummary.totalAmount);
      await data.save();
      fullPaidWithCredit = true;
      // send order confirmed email.
      const shippingInfo = await CustomerShippingAddressModel.findOne({
        customer: customerExist._id,
      }).lean();

      shippingInfo["fullAddress"] = addressConcat(shippingInfo);


      const order = await OrderModel.findOne({ 
        orderId: data.orderId, 
      }).populate("customer");

      if(data?.site == 'auctropin') {
        AuctropinCustomerMailController.order.sendNewOrderMail({
          shippingInfo,
          order,
        });
      } else {
        CustomerMailController.order.sendNewOrderMail({
          shippingInfo,
          order,
        });
      }
    }

    if(parseFloat(customerExist.availableCreditBalance)) {
      // add to log.

      let usingCredit = 0;

      const creditBalance = parseFloat(customerExist.availableCreditBalance);
      const totalAmount = parseFloat(data.orderSummary?.totalAmount);

      if(parseFloat(creditBalance)) {
        if(parseFloat(totalAmount)>creditBalance) {
          usingCredit = parseFloat(creditBalance);
        } else if (parseFloat(totalAmount) <= creditBalance) {
          usingCredit = parseFloat(totalAmount);
        }
      }
      // add to history.
      await CreditHistory.create({
        amount: usingCredit,
        previousBalance: parseFloat(customerExist.availableCreditBalance),
        customerId: customerExist._id,
        description: `Order #${data.orderId} has used credit balance.`,
        orderId: data._id,
        type: "debit",
      });
    }

    customerExist.availableCreditBalance = remainingBalance <= 0 ? 0 : remainingBalance;
    await CustomerModel.updateOne({_id: customerExist._id},{
      "$set": {
        "availableCreditBalance": customerExist.availableCreditBalance,
      }
    });

    const response = JSON.parse(JSON.stringify(data));
    response.paymentDetails = paymentDetails;
    response.usedCredit = fullPaidWithCredit;

    // socketEmit.order.orderCreate(req.io, notificationData);
    return res
      .status(200)
      .json(
        responseSuccess(
          customerControllerMessages.order.orderCreate.successMsg,
          response
        )
      );
  } catch (error) {
    // console.log(error)
    console.log("ERROR", error);
    return res
      .status(402)
      .json(
        responseError(
          error.message ||
          customerControllerMessages.order.orderCreate.catchError,
          402
        )
      );
  }
};

export const fetchPaymentDetails = async (req, res, next) => {
  try {
    const orderId = req.body.orderId;
    const order = await OrderModel.findOne({ orderId, customer: req.customer?._id });
    if (!order) {
      return res.status(400).json(responseError("Order not found."));
    }
    const paymentId = order.payment.paymentId;
    if (order.payment.status == "expired" || order.payment.status == "failed") {
      return res.status(400).json(responseError("Payment details expired!"));
    }

    if (!paymentId) {
      return res.status(400).json(responseError("Payment details not saved for this order."));
    }

    const resp = await fetch(
      `https://api.nowpayments.io/v1/payment/${paymentId}`,
      {
        method: "GET",
        headers: {
          "x-api-key": process.env.NOWPAYMENT_API_KEY,
        },
      }
    );
    const paymentDetails = await resp.json();

    if (!paymentDetails?.payment_id) {
      return res.status(400).json(responseError("Payment details not found for this order."));
    }
    return res.status(200).json(responseSuccess("Success", paymentDetails));
  } catch (error) {
    console.log("ERROR", error);
    return res
      .status(402)
      .json(
        responseError(
          error.message ||
          customerControllerMessages.order.orderCreate.catchError,
          402
        )
      );
  }
}


const isPaymentExpired = (order) => {
  const expireInSec = 3 * 3600; // 3hr.
  //return order.payment.status == "expired" || order.payment.status=="failed" || (new Date() - new Date(order.payment.paymentCreatedAt))/1000>=3*3600;
  return order.payment.status == "expired" || order.payment.status == "failed" || ((new Date() - new Date(order.payment.paymentCreatedAt || order.createdAt)) / 1000 >= expireInSec && order.payment.status == "waiting");
}

const showOrderAgain = (order) => {
  if (order.status == "PENDING" && (new Date() - new Date(order.createdAt)) / 1000 >= 15 * 24 * 3600) { // if order is pending and more then 15 days ago created.
    return true;
  }
  const shippedDate = (order.statusUpdatedAtRecords || []).filter((e) => e.status == "FULLY_SHIPPED")[0]?.updatedAt;
  if (shippedDate && order.status == "FULLY_SHIPPED" && (new Date() - new Date(shippedDate)) / 1000 >= 1 * 24 * 3600) {
    return true;
  }
  return false;
}

export const retryPayment = async (req, res) => {
  try {
    return res.status(400).json(responseError("Retry payment for order is temporary disabled. Please order again instead of retry!"));
    const orderId = req.body.orderId;
    const order = await OrderModel.findOne({ orderId, customer: req.customer._id });
    if (!order) {
      return res.status(400).json(responseError("Order not found."))
    }

    if (!isPaymentExpired(order)) {
      return res.status(400).json(responseError("Current payment details not expired."));
    }
    if (showOrderAgain(order)) {
      return res.status(400).json(responseError("Please re-order."));
    }

    const paymentDetails = await createBTCPayPaymentRequest(
        order.orderId,
        order.orderSummary.totalAmount,
    );

    if (!paymentDetails?.payment_id) {
      return res
        .status(402)
        .json(
          responseError(
            customerControllerMessages.order.orderCreate.paymentError,
            402
          )
        );
    }

    order.payment.paymentId = paymentDetails?.payment_id;
    order.payment.paymentCreatedAt = new Date();
    order.payment.status = "waiting";
    order.payment.paymentMethod = "btcpay";
    await order.save();

    console.log("payment status updated to waiting for retry payment");
    return res.status(200).json(responseSuccess("Success", paymentDetails));
  } catch (error) {
    // console.log(error)
    console.log("ERROR", error);
    return res
      .status(402)
      .json(
        responseError(
          error.message ||
          "Failed to retry payment.",
          402
        )
      );
  }
}

export const checkOrderPaymentStatus = async (req, res) => {
  const orderId = req.query.orderId;
  if (!orderId) {
    return res.status(400).json(responseError("orderId is required.", 400));
  }
  try {
    const order = await OrderModel.findOne({ orderId });
    if (!order) {
      return res.status(400).json(responseError("order not found.", 400));
    }
    return res.status(200).json(
      responseSuccess("Success", {
        paymentCompleted: order.payment.isPaymentCompleted,
      })
    );
  } catch (err) {
    return res.status(500).json(responseError(err.message, 500));
  }
};

export const orderIPN = async (req, res) => {
  try {
    console.log("Received Webhook Payload : ",req.body);
    let paymentMethod = 'btcpay';
    let paymentStatus, paymentDetails;

    // Verify BTCPay Server webhook if it's from BTCPay
    if (req.path === '/api/v1.0/btcpay/webhook') {
      paymentMethod = 'btcpay';
      // Only verify webhook signature in production
      // if (process.env.DISABLE_PAMENT_VERIFY != "true") {
      //   if (!verifyBTCPayWebhook(req)) {
      //     console.error('Invalid BTCPay webhook signature');
      //     return res.status(401).json({ message: 'Invalid webhook signature' });
      //   }
      // }
      if(!req.body.invoiceId) {
        return res.status(200).json({ message: 'Invalid webhook' });
      }
      paymentDetails = await checkBTCPayPaymentStatus(req?.body?.invoiceId);
      paymentStatus = paymentDetails.payment_status;
    } else {
      paymentMethod = 'nowpayments';
      // NowPayments IPN handling
      let {
        actually_paid,
        pay_amount,
        payment_status,
        payment_id,
        order_id,
        price_amount,
        pay_address,
      } = req.body;

      // Only verify payment in production
      if (process.env.DISABLE_PAMENT_VERIFY != "true") {
        const resp = await fetch(
          `https://api.nowpayments.io/v1/payment/${payment_id}`,
          {
            method: "GET",
            headers: {
              "x-api-key": process.env.NOWPAYMENT_API_KEY,
            },
          }
        );
        const data = await resp.json();
        if (data.order_id != order_id) {
          console.log("OrderId not same.", data);
          return res.status(200).json({
            message: "Payment status are not same.",
          });
        }
        payment_status = data.payment_status;
        pay_amount = data.pay_amount;
        actually_paid = data.actually_paid;
        pay_address = data.pay_address;
        price_amount = data.price_amount;
      }
      paymentStatus = payment_status;
      paymentDetails = {
        payment_id,
        payment_status,
        pay_address,
        price_amount,
        pay_amount,
        actually_paid,
        order_id,
        paymentMethod: 'nowpayments'
      };
    }

    if(paymentStatus == "waiting") {
      console.log("payment is waiting returing.")
      return res.status(200).json({ message: "success" });
    }

    const order = await OrderModel.findOne({ 
      orderId: paymentDetails.order_id 
    }).populate("customer");

    if (!order) {
      console.log("Order not found");
      return res.status(200).json({ message: "Order not found!" });
    }

    if (order.payment.isPaymentCompleted) {
      if (paymentStatus == "finished") {
        order.payment.status = paymentStatus;
        await order.save();
      }
      return res.status(200).json({ message: "Already confirmed." });
    }

    if (order.payment.paymentId && order.payment.paymentId != paymentDetails.payment_id) {
      console.log("PaymentIDNotSameWebHook::", paymentDetails);
      return res.status(200).json({ message: "Payment id not same." });
    }

    // Handle failed payments
    const failedStatus = ["failed", "expired", "partially_paid"];
    if (failedStatus.includes(paymentStatus) && !failedStatus.includes(order.payment.status) && !order.payment.isPaymentCompleted) {
      const coupon = await CouponModel.findOne({ _id: order.orderSummary?.coupon?.coupon });
      if (coupon) {
        coupon.totalUses = coupon.totalUses || 0;
        coupon.totalUses -= 1;
        coupon.totalUses = coupon.totalUses || 0;
        await coupon.save();
      }
    }

    order.payment.status = paymentStatus;
    order.payment.paidAmountUSD = paymentDetails.price_amount;

    //if (paymentMethod === 'nowpayments') {
    order.payment.paidAmount = paymentDetails.actually_paid;
    order.payment.receiverAddress = paymentDetails.pay_address;
    //}

    await order.save();

    if (paymentStatus == "sending" || paymentStatus == "finished") {
      if (order.payment.isPaymentCompleted) {
        return res.status(200).json({ message: "OK" });
      }

      if (!failedStatus.includes(paymentStatus) && paymentDetails.pay_amount) {
        try {
          await CustomerModel.findOneAndUpdate(
            { _id: order.customer },
            { lastOrderPaidAt: new Date() },
            { new: true }
          );
          
          if (order?.site == 'hb') {
            await CustomerNotificationModel.deleteMany({
              customerId: order?.customer?._id,
              "meta.orderId": order?.orderId,
            });
            
            await CustomerNotificationClass.CreateCustomerNotification(
              CustomerNotificationTypeEnum.ORDER_PAID,
              {
                customerId: order?.customer?._id,
                orderId: order.orderId,
                isDisplay: true,
              }
            );
          }
        } catch (error) {
          console.log(`Customer Notification create failed: orderId: ${order.orderId}`, error?.message);
        }

        // Update product stats
        for (let product of order.products) {
          await ProductModel.findOneAndUpdate(
            { _id: product.product },
            {
              $inc: {
                "stats.totalSoldCount": product.quantity,
                "stats.totalSoldAmount": parseFloat(product.totalAmount),
              },
              "stats.lastSoldAt": order?.createdAt,
            },
            { new: true }
          );
        }
      }

      order.status = "PAID";
      order.payment.isPaymentCompleted = true;
      order.payment.paidAt = new Date();
      order.statusUpdatedAtRecords.push({
        status: "PAID",
        updatedAt: new Date(),
      });
      await order.save();

      // Create notification
      try {
        const notificationCreateData = {
          customer: order.customer?._id || order.customer,
          message: `${order.site == 'auctropin' ? 'Auctropin' : 'H&B'} Order New Order.`,
          isRead: false,
          info: {
            type: "order",
            uriCode: order.orderId,
          },
          site: order.site
        };
        await NotificationModel.deleteMany({
          customer: order.customer?._id || order.customer,
          type: "order",
          "info.uriCode": order?.orderId
        });

        const data = await NotificationModel.create(notificationCreateData);
        notifySocketAdmin("admin", "notifications", await NotificationModel.populate(data, "customer"));
        console.log("Notification created!");
      } catch (err) {
        console.log("Error creating notification::", err);
      }

      const shippingInfo = await CustomerShippingAddressModel.findOne({
        customer: order.customer._id,
      }).lean();
      shippingInfo["fullAddress"] = addressConcat(shippingInfo);

      if (order?.customer?.isEmailInvalid === true) {
        return res.status(200).json({
          success: false,
          code: 400,
          redirectTo: Constants.redirectTo,
          message: "Your current email is invalid/not reachable, please update your email to your one of operational email in order to use H&B and get updates.",
        });
      }

      if(order?.site == 'auctropin') {
        AuctropinCustomerMailController.order.sendNewOrderMail({
          shippingInfo,
          order,
        });
      } else {
        CustomerMailController.order.sendNewOrderMail({
          shippingInfo,
          order,
        });
      }

      return res.status(200).json({ message: "Success" });
    }

    // Handle partially paid status
    if (paymentStatus == "partially_paid") {
      const shippingInfo = await CustomerShippingAddressModel.findOne({
        customer: order.customer._id,
      }).lean();
      shippingInfo["fullAddress"] = addressConcat(shippingInfo);
      
      if(order?.site == 'auctropin') {
        AuctropinCustomerMailController.order.sendPaidLessAmountMail({order, shippingInfo});
      } else {
        CustomerMailController.order.sendPaidLessAmountMail(
          { order, shippingInfo },
          paymentDetails.actually_paid,
          paymentDetails.pay_amount
        );
      }
      return res.status(200).json({ message: "partically paid" });
    }

    // Handle failed payments
    if (
      paymentStatus !== "confirmed" &&
      paymentStatus !== "confirming" &&
      paymentStatus !== "waiting"
    ) {
      if(order.orderPaymentExiredMailSentAt) {
        return res.status(200).json({ message: "payment failed" });
      }
      
      order.orderPaymentExiredMailSentAt = new Date();
      await order.save();
      
      const shippingInfo = await CustomerShippingAddressModel.findOne({
        customer: order.customer._id,
      }).lean();
      shippingInfo["fullAddress"] = addressConcat(shippingInfo);
      
      if(order.site == 'auctropin') {
        AuctropinCustomerMailController.order.sendPaymentFailedMail({order, shippingInfo});
      } else {
        CustomerMailController.order.sendPaymentFailedMail({ order, shippingInfo });
      }
      return res.status(200).json({ message: "payment failed" });
    }

    return res.status(200).json({ message: "status is not valid" });
  } catch (error) {
    console.error("Failed to process payment:", error);
    return res.status(500).json({ error: "Failed to process payment" });
  }
};

export const getMyOrders = async (req, res) => {
  try {

    const { page, limit, site = 'hb', q, startDate, endDate, minPrice, maxPrice, sort } = req.query;
    const query = {
      isTestOrder:{$ne:true}
    }
    if (site !== "all" && site !== "" && site) {
      query['site'] = site.trim()
    }
    const totalPending = await OrderModel.countDocuments({
      ...query,
      customer: req?.customer?._id,
      $or:[ { "payment.status": "waiting" },
        { "payment.status": { $nin: ["expired", "failed"] } },
        { "status": "PENDING" }],
      
    });

    // Count complete orders
    const totalComplete = await OrderModel.countDocuments({
      ...query,
      customer: req?.customer?._id,
      status: "FULLY_SHIPPED",
    });
    const totalOrder = await OrderModel.countDocuments({
      ...query,
      customer: req?.customer._id,
    });
    // Get the order list
    const options = {
      model: OrderModel,
      query: {
        isTestOrder:{$ne:true}
      },
      sort: {
        createdAt: -1,
      },
      select: null,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      hint: null,
      populate: [
        {
          path: "customer",
          model: CustomerModel,
          select: "_id firstName lastName email avatar site isEmailInvalid emailInvalidReason",
        },
        {
          path: "comments.createdByAdmin",
          model: AdminModel,
          select: "_id firstName lastName avatar email",
        },
        {
          path: "comments.createdByCustomer",
          model: CustomerModel,
          select: "_id firstName lastName email avatar site isEmailInvalid emailInvalidReason",
        },
        {
          path: "shipping.shippingOptionSetting",
          model: ShippingSettingModel,
        },
        {
          path: "editedByAdmins.product",
          model: ProductModel,
        }
      ],
    };

    if (q) {
      options.query = {
        "products.title": { $regex: new RegExp(q, "i") },
      };
    }

    if (site !== "all" && site !== "" && site) {
      options.query['site'] = site.trim()
    }
    if (startDate && endDate) {
      if (!isValidDate(startDate)) {
        return res
          .status(400)
          .json(
            responseError(
              "Query startDate invalid!"
            )
          );
      }
      if (!isValidDate(endDate)) {
        return res
          .status(400)
          .json(
            responseError(
              "Query endDate invalid!"
            )
          );
      }

      options.query["createdAt"] = {
        $gte: moment(startDate)
          .startOf("day")
          .toDate(),
        $lte: moment(endDate)
          .endOf("day")
          .toDate(),
      };
    }

    if (req.query.hasOwnProperty("minPrice") && minPrice) {
      const minNum = parseFloat(minPrice);
      if (!isNaN(minNum)) {
        // Check if minNum is not equal to 0 to avoid unnecessary filtering
        options.query["payment.paidAmount"] = {
          $gte: minNum,
          ...(options.query["payment.paidAmount"] || {}), // Preserve existing filters if any
        };
      }
    }

    if (req.query.hasOwnProperty("maxPrice") && maxPrice) {
      const maxNum = parseFloat(maxPrice);
      if (!isNaN(maxNum) && maxNum !== 0) {
        options.query["payment.paidAmount"] = {
          ...(options.query["payment.paidAmount"] || {}), // Preserve existing filters if any
          $lte: maxNum,
        };
      }
    }

    if (
      req.query.hasOwnProperty("trackingStatus") &&
      req.query.trackingStatus
    ) {
      if (req.query.trackingStatus?.trim().toLowerCase() == 'all') {
        options.query = {
        }
      } else {
        if (typeof req.query.trackingStatus === "string") {
          let filteredArray = req.query.trackingStatus.split(",").filter(value => value.trim() !== "");
          options.query["$or"] = [];
          if (filteredArray.includes("EXPIRED")) {
            filteredArray = filteredArray.filter((e) => e != "EXPIRED");
            options.query["$or"].push({ "payment.status": "expired" });
            options.query["$or"].push({ "payment.status": "failed" });
            const past3Hours = new Date();
            past3Hours.setHours(past3Hours.getHours() - 3);
            //past3Hours.setMinutes(past3Hours.getMinutes()-1);
            options.query["$or"].push({ "payment.paymentCreatedAt": { $lte: past3Hours }, "payment.status": "waiting" });
          }
          if (filteredArray.includes("PENDING")) {
            filteredArray = filteredArray.filter((e) => e != "PENDING");
            options.query["$or"].push({ "payment.status": { $nin: ["expired", "failed"] }, "status": "PENDING" });
            options.query["$or"].push({ "payment.status": "waiting" });
          
          }
          if (filteredArray.length > 0) {
            options.query["$or"].push({
              "status": { $in: filteredArray }
            })
          }
        }
      }
    }


    if (
      req.query.hasOwnProperty("trackingNumbers") &&
      req.query.trackingNumbers
    ) {
      if (typeof req.query.trackingNumbers === "string") {
        const filteredArray = req.query.trackingNumbers.split(",");
        const filtered =
          filteredArray?.length > 0
            ? filteredArray.filter(
              (value) => value !== "" && value !== null && value !== undefined
            )
            : [];
        if (filtered.length) {
          options.query["tracking.numbers"] = {
            $elemMatch: {
              $in: filtered
            }
          }
        }
      }
    }
    if (req.query.hasOwnProperty("orderIds") && req.query.orderIds) {
      if (typeof req.query.orderIds === "string") {
        const filteredArray = req.query.orderIds.split(",");
        let filtered =
          filteredArray?.length > 0
            ? filteredArray.filter(
              (value) => value !== "" && value !== null && value !== undefined
            )
            : [];
        if (filtered.length) {
          filtered = filtered.map(item => item.replace(/#/g, "").trim())
          options.query["orderId"] = { $in: filtered };
        }
      }
    }

    if (
      req.query.hasOwnProperty("paymentStatus") &&
      req.query.paymentStatus
    ) {
      if (typeof req.query.paymentStatus === "string") {
        const filteredArray = req.query.paymentStatus.split(",").filter(value => value.trim() !== "");
        if (filteredArray.length > 0) {
          options.query["payment.status"] = { $in: filteredArray };
        }
      }
    }

    if (
      req.query.hasOwnProperty("isPaymentCompleted") &&
      req.query.isPaymentCompleted !== undefined &&
      req.query.isPaymentCompleted !== ''
    ) {
      options.query["payment.isPaymentCompleted"] = req.query.isPaymentCompleted === 'true';
    }
    options.query["customer"] = req?.customer?._id;
    if (sort) {
      switch (sort) {
        case "latest":
          options.sort = { createdAt: -1 };
          break;
        case "oldest":
          options.sort = { createdAt: 1 };
          break;
        case "highToLow":
          options.sort = { "payment.paidAmount": -1 };
          break;
        case "lowToHigh":
          options.sort = { "payment.paidAmount": 1 };
          break;

        case "date.asc":
          options.sort = { "payment.paidAt": 1 };
          break;
        case "date.desc":
          options.sort = { "payment.paidAt": -1 };
          break;
        case "amount.asc":
          options.sort = { "orderSummary.totalAmount": 1 };
          break;
        case "amount.desc":
          options.sort = { "orderSummary.totalAmount": -1 };
          break;
        default:
          options.sort = { createdAt: -1 };
          break;
      }
    }

    console.log(options.query, req.query)

    const { paginate, data } = await findWithPagination(options);

    return res.status(200).json(
      responseSuccess(
        data.length
          ? customerControllerMessages.order.getMyOrders.successMsg
          : customerControllerMessages.order.getMyOrders.catchError,
        {
          totalPending,
          totalComplete,
          totalOrder,
          paginate,
          orders: data,
        }
      )
    );
  } catch (error) {
    console.error("Failed to get customer orders:", error);
    return res.status(400).json(responseError("Failed to get customer orders"));
  }
};

// Get a single order
export const getMySingleOrder = async (req, res) => {
  try {
    const orderId = req.params?.orderId;
    const order = await OrderModel.findOne({
      orderId: orderId,
      customer: req.customer?._id,
    }).populate([
      {
        path: "customer",
        model: CustomerModel,
        select: "_id firstName lastName email avatar site isEmailInvalid emailInvalidReason",
      },
      {
        path: "comments.createdByAdmin",
        model: AdminModel,
        select: "_id firstName lastName avatar email",
      },
      {
        path: "comments.createdByCustomer",
        model: CustomerModel,
        select: "_id firstName lastName email avatar site isEmailInvalid emailInvalidReason",
      },
      {
        path: "shipping.shippingOptionSetting",
        model: ShippingSettingModel,
      },
      {
        path: "editedByAdmins.product",
        model: ProductModel,
      }
    ])
      .lean();

    return res.json(responseSuccess("order details", order));
  } catch (error) {
    return res.status(400).json({ error: "Failed to fetch order" });
  }
};

export const getMyOrderStats = async (req, res) => {
  try {
    const { site = 'hb' } = req.query
    const order = {}
    const query = {

    }
    if (site !== "all" && site !== "" && site) {
      query['site'] = site.trim()
    }
    order['totalOrderCount'] = await OrderModel.countDocuments({ ...query, customer: req.customer?._id }).lean()

    order['totalOrderShipmentPending'] = await OrderModel.countDocuments({ ...query, status: { $in: ["PAID", "PACKED"] }, "payment.isPaymentCompleted": true, customer: req.customer?._id, }).lean()
    return res.json(responseSuccess("order stats", order));
  } catch (error) {
    return res.status(400).json({ error: "Failed to fetch order stats" });
  }
};

export const commentsAdd = async (req, res, next) => {
  try {
    const { orderId, message } = req.body;

    const order = await OrderModel.findOneAndUpdate(
      { orderId: orderId },
      {
        $push: {
          comments: {
            $each: [
              {
                message: message,
                createdByCustomer: req?.customer?._id,
                sendEmailAsWell: true,
                createdAt: new Date(),
              },
            ],
            $sort: { createdAt: 1 },
          },
        },
      },
      { new: true }
    )
      .populate([
        {
          path: "customer",
          model: CustomerModel,
          select: "_id firstName lastName email avatar site isEmailInvalid emailInvalidReason",
        },
        {
          path: "comments.createdByAdmin",
          model: AdminModel,
          select: "_id firstName lastName avatar email",
        },
        {
          path: "comments.createdByCustomer",
          model: CustomerModel,
          select: "_id firstName lastName email avatar site isEmailInvalid emailInvalidReason",
        },
      ])
      .select("comments orderId _id site")
      .lean() || {};

    if (!order?._id) {
      return res.status(400).json(
        responseError(
          customerControllerMessages.order.commentsAdd.errorMsg
        )
      );
    }


    if (order?.customer?.isEmailInvalid == true) {
      return res.status(400).json({
        success: false,
        code: 400,
        redirectTo: Constants.redirectTo,
        emailInvalidReason: order?.customer?.emailInvalidReason,
        email: order?.customer?.email,
        customerId: order?.customer?._id,
        message: "Your current email is invalid/not reachable, please update your email to your one of operational email in order to use H&B and get updates.",
      });
    }
    order?.site == 'auctropin' ? AuctropinCustomerMailController.order.sendOrderCommentSendMailToCustomer({
      ...order,
      message: message,
    }) :
      CustomerMailController.order.sendOrderCommentSendMailToCustomer({
        ...order,
        message: message,
      });

    notifySocketAdmin("admin", "comments", order);

    const notificationCreateData = {
      customer: req?.customer?._id,
      message: `${order.site == 'auctropin' ? 'Auctropin' : 'H&B'} Order New comment.`,
      isRead: false,
      info: {
        type: "orderComment",
        uriCode: order.orderId,
      },
      site: order?.site
    };
    await NotificationModel.deleteMany({ customer: req?.customer?._id, type: "orderComment", "info.uriCode": order?.orderId })
    const data = await NotificationModel.create(
      notificationCreateData
    );
    notifySocketAdmin("admin", "notifications", await NotificationModel.populate(data, "customer"));
    console.log("Notification created!");

    return res.status(200).json(
      responseSuccess(
        customerControllerMessages.order.commentsAdd.successMsg,
        order
      )
    );
  } catch (error) {
    next(error);
  }

}

export const reviewAdd = async (req, res, next) => {
  try {
    let { orderId, reviewMessage, ratingStar } = req.body;

    ratingStar = parseInt(ratingStar)
    const orderReview = {
      reviewMessage,
      ratingStar,
      createdAt: new Date()
    }
    const data = await OrderModel.findOne({ orderId: orderId, customer: req?.customer?._id }).lean()
    if (!data?._id) {
      return res.status(400).json(responseError('Order not exist!', 400))
    }

    if (data?.orderReview?.reviewMessage) {
      return res.status(400).json(responseError('Review already exist!', 400))
    }
    const order = await OrderModel.findOneAndUpdate({ orderId: orderId, customer: req?.customer?._id }, { orderReview }, { new: true }).populate([
      {
        path: "customer",
        model: CustomerModel,
        select: "_id firstName lastName email avatar site isEmailInvalid emailInvalidReason",
      },
      {
        path: "comments.createdByAdmin",
        model: AdminModel,
        select: "_id firstName lastName avatar email",
      },
      {
        path: "comments.createdByCustomer",
        model: CustomerModel,
        select: "_id firstName lastName email avatar site isEmailInvalid emailInvalidReason",
      },
    ]).lean()


    const products = order.products.map(pd => pd.product)
    const matchProducts = await ProductModel.find({ _id: products })

    for (let product of matchProducts) {
      const reviewCount = (product?.ratingInfo?.reviewCount || 0) + 1;
      const totalStarSumCount = (product?.ratingInfo?.totalStarSumCount || 0) + ratingStar
      const avgRating = Number(parseFloat((totalStarSumCount / reviewCount)).toFixed(2))

      const ratingInfo = {
        reviewCount,
        avgRating,
        totalStarSumCount
      }
      product.ratingInfo = ratingInfo;
      await product.save()
    }

    if (process.env.SEND_EMAIL_TO_ADMINISTRATOR == 'YES') {
      order?.site == 'auctropin' ? AuctropinCustomerMailController.order.customerOrderReviewAndSendMailToAdmin({
        ...order,
        reviewMessage: reviewMessage,
        ratingStar: ratingStar
      }) :
        CustomerMailController.order.customerOrderReviewAndSendMailToAdmin({
          ...order,
          reviewMessage: reviewMessage,
          ratingStar: ratingStar
        });
    }
    return res.status(201).json(responseSuccess('Review added successfully!', order))

  } catch (error) {
    next(error);
  }
}

// export const usdToBtc = async (req, res) => {
//     try {
//         const usd = req.params.usd;

//         let nowPaymentApiKey = "9PQ2JEB-1M64ZRE-M3AGS6V-JWTS9NF";
//         var myHeaders = new Headers();
//         myHeaders.append("x-api-key", nowPaymentApiKey);

//         var requestOptions = {
//             method: 'GET',
//             headers: myHeaders,
//             redirect: 'follow'
//         };

//         await fetch(`https://api.nowpayments.io/v1/estimate?amount=${usd}&currency_from=usd&currency_to=btc`, requestOptions)
//             .then(response => response.text())
//             .then((result) => {
//                 res.json(JSON.parse(result));
//             })
//             .catch(error => console.log('error', error));

//     } catch (error) {
//         console.error('Failed to get btc:', error);
//         res.status(500).json({ error: 'Failed to get btc' });
//     }
// }
