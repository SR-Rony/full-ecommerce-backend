import axios from "axios";
export const createPaymentForOrder=async (orderId,amount) => {
    const data = {
        "price_amount": amount,
        "price_currency": "usd",
        "pay_currency": "btc",
        "order_id": orderId,
        "order_description": "Pay with",
        "ipn_callback_url": process.env.IPN_CALLBACK_URL,
        "success_url": `https://peptide.shop/shipping/checkout_confrimation`,
        "cancel_url": `https://peptide.shop`
    }
    try {
        const res = await axios.post('https://api.nowpayments.io/v1/payment',data,{
            headers: {
                'x-api-key': process.env.NOWPAYMENT_API_KEY
            }
        });

        if(!res.data.pay_address || !res.data.payment_id) {
            throw new Error(res.data)
        }
        return res.data;
    } catch(err) {
        throw new Error(err.response?.data?.message || err.message)
        console.log("Error::createPaymentForOrder ",err)
    }
    return null;
}