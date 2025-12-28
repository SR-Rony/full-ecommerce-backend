import Redis from 'ioredis'
import CONFIG from '../config/index.js'

const redisOptions = {
  port: CONFIG.DB.REDIS.REDIS_PORT,
  host: CONFIG.DB.REDIS.REDIS_URL,
  password: CONFIG.DB.REDIS.REDIS_PASSWORD,
  socket: CONFIG.DB.REDIS.SOCKET
}

export const redis = new Redis(redisOptions)

export const generateOTP = async (otp, data, otpTTL = 600) => {
  const otpKey = `otp:${otp}:${data.email}`

  // Check if OTP already generated within the last 10 minutes
  const existingOTP = await redis.get(otpKey)
  if (existingOTP) {
    throw new Error(
      'OTP already generated for this customer within the last 10 minutes'
    )
  }

  await redis.setex(otpKey, otpTTL, JSON.stringify({ ...data, code: otp }))
  console.log('otp code is', { ...data, code: otp })
  return otp
}

export const verifyOTP = async (otp, email) => {
  const otpKey = `otp:${otp}:${email}`

  // Retrieve the stored OTP from Redis
  var storedOTP = await redis.get(otpKey)
  storedOTP = JSON.parse(storedOTP)

  // Check if the entered OTP matches the stored OTP
  if (storedOTP?.code === otp) {
    // OTP is valid; you can perform additional actions here if needed
    console.log(`OTP is valid for user ${email}`)
    await redis.del(otpKey)
    return storedOTP
  } else {
    // OTP is invalid
    console.log(`Invalid OTP for user ${email}`)
    return false
  }
}

function generateOTPCode() {
  // Declare a string variable
  // which stores all string
  var string = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let OTP = ''
  // Find the length of string
  var len = string.length
  for (let i = 0; i < 6; i++) {
    OTP += string[Math.floor(Math.random() * len)]
  }
  return OTP
}

export const generateUniqueCode = async obj => {
  try {
    const otp = genRandomCode()
    const code = await generateOTP(otp, obj)
    return code
  } catch (error) {
    redis.quit()
    return false
  }
}

const genRandomCode = () => {
  const randomOTP = Math.floor(100000 + Math.random() * 900000)
  const otp = `${randomOTP}`
  return otp
}

export const generateUniqueForOrderTrackingNumber = async (data) => {
  let isUnique = false
  let newCode

  try {
    do {
      newCode = genRandomCode()
      const existingCode = await redis.get(newCode)
      if (!existingCode) {
        // Code is unique
        isUnique = true
      } else {
      }
    } while (!isUnique)

    const otpKey = `orderTrackingNumber:${newCode}`
    await redis.set(otpKey, JSON.stringify(data))

    return newCode
  } catch (err) {
    console.log(err)
  }
}

export async function generateUniqueForOrderId(data) {
  let isUnique = false
  let newCode

  try {
    do {
      newCode = generateOTPCode()
      const existingCode = await redis.get(newCode)
      if (!existingCode) {
        // Code is unique
        isUnique = true
      } else {
      }
    } while (!isUnique)

    const otpKey = `orderId:${newCode}`
    await redis.set(otpKey, JSON.stringify(data))
    return newCode
  } catch (err) {
    console.log(err)
  }
}

export const isExpired = expiryDate => {
  const currentTimestamp = Date.now()
  const expiryTimestamp = new Date(expiryDate).getTime()

  // Compare the current timestamp with the expiry timestamp
  return currentTimestamp > expiryTimestamp
}



export const isCouponValid = async (coupon, cartProducts, dontCheckProduct) => {
  const isExpired = coupon.expiry && new Date(coupon.expiry) <= new Date();
  const isQuantityExceeded = coupon.quantity !== null && coupon.totalUses >= coupon.quantity;

  if (isExpired || isQuantityExceeded) {
    return {
      success: false,
      message: isExpired ? "The coupon has expired." : "The coupon has reached its usage limit.",
    };
  }

  if (dontCheckProduct || coupon.enableAllProducts) {
    return { success: true, message: "Coupon has been applied" };
  }

  const couponProductsSet = new Set(coupon.products.map(e => e.toString()));

  for (let product of cartProducts) {

    if (couponProductsSet.has(product?.product? product?.product?.toString():product.toString())) {
      return { success: true, message: "Coupon has been applied" };
    }
  }

  return {
    success: false,
    message: "The coupon does not apply to any product in the cart.",
  };
};
