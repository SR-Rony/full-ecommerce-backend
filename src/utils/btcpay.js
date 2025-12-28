import crypto from 'crypto';
import fetch from 'node-fetch';

const BTCPAY_API_URL = process.env.BTCPAY_API_URL;
const BTCPAY_API_KEY = process.env.BTCPAY_API_KEY;
const BTCPAY_STORE_ID = process.env.BTCPAY_STORE_ID;
const BTCPAY_WEBHOOK_SECRET = process.env.BTCPAY_WEBHOOK_SECRET;

export const verifyBTCPayWebhook = (req) => {
  try {
    const signature = req.headers['btcpay-sig'];
    if (!signature) {
      return false;
    }

    const hmac = crypto.createHmac('sha256', BTCPAY_WEBHOOK_SECRET);
    const payload = JSON.stringify(req.body);
    const calculatedSignature = hmac.update(payload).digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedSignature)
    );
  } catch (error) {
    console.error('BTCPay webhook verification failed:', error);
    return false;
  }
};

export const createBTCPayPaymentRequest = async (orderId, amount) => {
  try {
    const response = await fetch(`${BTCPAY_API_URL}/api/v1/stores/${BTCPAY_STORE_ID}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `token ${BTCPAY_API_KEY}`
      },
      body: JSON.stringify({
        "metadata": {
            "orderId": orderId,
            "orderUrl": `https://peptide.site/customer/order/details/${orderId}`,
        },
        "checkout": {
            "redirectURL": "https://peptide.site/",
        },
        "amount": amount,
      }),
    });

    if (!response.ok) {
      throw new Error(`BTCPay Server API error: ${response.statusText}`);
    }

    const data = await response.json();

    // get payment methods.
    const payMethodRes = await (await fetch(`${BTCPAY_API_URL}/api/v1/stores/${BTCPAY_STORE_ID}/invoices/${data.id}/payment-methods`,{
      headers: {
        'Authorization': `token ${BTCPAY_API_KEY}`
      }
    })).json();

    if(!payMethodRes.length) {
      throw new Error("Payment method not found!");
    }

    const paymentMethod = payMethodRes[0];

    const destAddress = paymentMethod.destination;
    const btcAmount = paymentMethod.amount;
    
    // Convert BTCPay response to NowPayments format
    return {
      payment_id: data.id,
      payment_status: 'New',
      pay_address: destAddress,
      order_id: orderId,
      price_amount: parseFloat(amount),
      price_currency: "USD",
      pay_amount: btcAmount,
      pay_currency: 'btc',
      paymentMethod: 'btcpay'
    };
  } catch (error) {
    console.error('BTCPay payment request creation failed:', error);
    throw error;
  }
};

export function getBtcpayPaymentStatus(invoice) {
  if(invoice.status == "Settled" || invoice.additionalStatus == "Marked") {
    return "finished";
  }
  if(invoice.status == "Invalid") {
    return "failed";
  }
  if(invoice.status == "New") {
    return "waiting";
  }
  if(invoice.status == "Processing" && invoice.additionalStatus == "PaidPartial") {
    return "partially_paid";
  }
  if(invoice.status == "Expired" && invoice.additionalStatus == "None") {
    return "expired";
  }
  if(invoice.status == "Processing") {
    return "waiting";
  }
  return "waiting";
}

export const checkBTCPayPaymentStatus = async (paymentId) => {
  try {
    const response = await fetch(`${BTCPAY_API_URL}/api/v1/stores/${BTCPAY_STORE_ID}/invoices/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${BTCPAY_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`BTCPay Server API error: ${response.statusText}`);
    }

    const data = await response.json();

    // get payment methods.
    const payMethodRes = await (await fetch(`${BTCPAY_API_URL}/api/v1/stores/${BTCPAY_STORE_ID}/invoices/${data.id}/payment-methods`,{
      headers: {
        'Authorization': `token ${BTCPAY_API_KEY}`
      }
    })).json();

    if(!payMethodRes.length) {
      throw new Error("Payment method not found!");
    }

    const paymentMethod = payMethodRes[0];

    const destAddress = paymentMethod.destination;
    const btcAmount = paymentMethod.amount;


    return {
        payment_id: data.id,
        payment_status: getBtcpayPaymentStatus(data),
        pay_address: destAddress, //
        actually_paid: parseFloat(paymentMethod.totalPaid),
        pay_amount: parseFloat(btcAmount),
        price_amount: parseFloat(data.amount),
        order_id: data.metadata.orderId,
        paymentMethod: 'btcpay'
    };

    // // Convert BTCPay response to NowPayments format
    // return {
    //   payment_id: data.id,
    //   payment_status: getBtcpayPaymentStatus(data),
    //   pay_address: data.checkoutLink,
    //   price_amount: data.amount,
    //   price_currency: data.currency.toLowerCase(),
    //   pay_amount: data.amount, // In BTCPay, amount is already in BTC
    //   pay_currency: 'btc',
    //   order_id: data.metadata.orderId,
    //   order_description: "",
    //   ipn_callback_url: `${process.env.BACKEND_URL}/api/v1.0/btcpay/webhook`,
    //   created_at: data.createdTime,
    //   updated_at: data.createdTime,
    //   purchase_id: data.id,
    //   amount_received: data.amount,
    //   payin_extra_id: null,
    //   smart_contract: '',
    //   network: 'btc',
    //   network_precision: 8,
    //   time_limit: null,
    //   burning_percent: null,
    //   expiration_estimate_date: data.expirationTime,
    //   paymentMethod: 'btcpay'
    // };
  } catch (error) {
    console.error('BTCPay payment status check failed:', error);
    throw error;
  }
}; 