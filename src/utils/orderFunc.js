import { isValidArray } from "./func.js";



export const getProductQuantity = (cartsProducts, productId) => {

    if (!isValidArray(cartsProducts)) return 1
    const existingProduct = cartsProducts.find(item => (item?.product.toString()) === productId.toString());
    if (existingProduct) {
        return existingProduct.quantity
    } else {
        return 1
    }
}

export const getTotalSumProductQuantity = (cartsArr, dbProducts) => {

    if (!(isValidArray(cartsArr) && isValidArray(dbProducts))) return 1
    const totalQuantity = cartsArr.filter(cP => dbProducts.some(dbP => dbP?._id?.toString() == cP?.product?.toString())).reduce((prev, curr) => prev + curr?.quantity, 0);
    return totalQuantity
}


export const getProductQuantityToTotalSaving = (cartsProducts, dbProducts, shippingSelect) => {
    if (!isValidArray(dbProducts)) return parseFloat(0).toFixed(2)
    const totalSaving = dbProducts.reduce((prev, curr) => {

        if (curr?.availability?.isInternational === true) {
            const discount = parseFloat(curr?.price?.regular) *
                parseFloat(getProductQuantity(cartsProducts, curr?._id) || 0) - parseFloat(curr?.price?.sale) *
                parseFloat(getProductQuantity(cartsProducts, curr?._id) || 0)

            return prev + discount;
        } else {
            if (isValidArray(curr?.availability?.countries) && curr?.availability?.countries.some(item => item?.country?.value == shippingSelect?.value)) {
                const discount = parseFloat(curr?.price?.regular) *
                    parseFloat(getProductQuantity(cartsProducts, curr?._id) || 0) - parseFloat(curr?.price?.sale) *
                    parseFloat(getProductQuantity(cartsProducts, curr?._id) || 0)
                return prev + discount;
            }
            return prev

        }

    }, 0)

    return parseFloat(totalSaving || 0).toFixed(2)
}




export function freeShippingCheck(
    subTotalPrice,
    freeShippingCost,
    shippingCost) {
    if (parseFloat(subTotalPrice) >= parseFloat(freeShippingCost)) {
        return {
            isFreeShipping: true,
            shippingCost: 0,
            message: '"Congratulations! You qualify for free shipping."'
        }
    } else {
        // Calculate total amount by adding shipping cost to subtotal
        return {
            isFreeShipping: false,
            shippingCost: shippingCost,
            message: `Unfortunately, free shipping is not applicable. A shipping cost of $${shippingCost} will be added. Your total amount is ${shippingCost}`,
        }
    }
}
export const SumTotalProductPrice = (cartsProducts, dbProducts, shippingSelect) => {
    if (isValidArray(dbProducts)) {
        var result = dbProducts.reduce(function (acc, obj) {

            if (obj?.availability?.isInternational === true) {
                return parseFloat(acc) + obj?.price?.sale * (getProductQuantity(cartsProducts, obj?._id))
            } else {
                if (isValidArray(obj?.availability?.countries) && obj?.availability?.countries.some(item => item?.country?.value == shippingSelect?.value)) {
                    return parseFloat(acc) + obj?.price?.sale * (getProductQuantity(cartsProducts, obj?._id))
                }
                return acc
            }

        }, 0);
        return parseFloat(result).toFixed(2)
    } else return parseFloat(0).toFixed(2)

}


export function calculateTotalAmountWithCouponProducts(dbProducts = [], cartsProducts = [], couponProductsArr = [], shippingCost = 0, couponPercent = 0, enableAllProducts, shippingSelect) {
    if (enableAllProducts) {

        const allProductCouponApplyAmount = dbProducts
            .reduce((acc, curr) => {
                if (curr?.availability?.isInternational === true) {
                    return acc + (parseFloat(curr?.price?.sale) || 0) * getProductQuantity(cartsProducts, curr?._id)
                } else {
                    if (isValidArray(curr?.availability?.countries) && curr?.availability?.countries.some(item => item?.country?.value == shippingSelect?.value)) {
                        return acc + (parseFloat(curr?.price?.sale) || 0) * getProductQuantity(cartsProducts, curr?._id)
                    }
                    return acc
                }

            }, 0);

        const finalAmount = applyDiscount(allProductCouponApplyAmount, couponPercent);
        const totalCouponProductDiscount = allProductCouponApplyAmount - finalAmount;
        return {
            finalAmount: (finalAmount === 0 ? 0 : finalAmount + shippingCost).toFixed(2),
            discountedCouponAmount: totalCouponProductDiscount.toFixed(2),
        };
    } else {
        const filterMyCartsDiscloseCouponAmount = dbProducts
            .filter(item => !(couponProductsArr.some(coupon => item?._id?.toString() == coupon?.toString())))
            .reduce((acc, curr) => {

                if (curr?.availability?.isInternational === true) {
                    return acc + (parseFloat(curr?.price?.sale) || 0) * getProductQuantity(cartsProducts, curr?._id)
                } else {
                    if (isValidArray(curr?.availability?.countries) && curr?.availability?.countries.some(item => item?.country?.value == shippingSelect?.value)) {
                        return acc + (parseFloat(curr?.price?.sale) || 0) * getProductQuantity(cartsProducts, curr?._id)
                    }
                    return acc
                }
            }, 0);
        const totalCouponProductAmount = dbProducts
            .filter(item => (couponProductsArr.some(coupon => item?._id?.toString() == coupon?.toString())))
            .reduce((acc, curr) => {
                if (curr?.availability?.isInternational === true) {
                    return acc + (curr?.price?.sale || 0) * getProductQuantity(cartsProducts, curr?._id)
                } else {
                    if (isValidArray(curr?.availability?.countries) && curr?.availability?.countries.some(item => item?.country?.value == shippingSelect?.value)) {
                        return acc + (curr?.price?.sale || 0) * getProductQuantity(cartsProducts, curr?._id)
                    }
                    return acc
                }
            }, 0);

        const couponFinalAmount = applyDiscount(totalCouponProductAmount, couponPercent);
        const totalCouponProductDiscount = totalCouponProductAmount - couponFinalAmount;

        const finalAmount = (filterMyCartsDiscloseCouponAmount + couponFinalAmount) === 0 ? 0 : (filterMyCartsDiscloseCouponAmount + couponFinalAmount) + shippingCost

        return {
            finalAmount: finalAmount.toFixed(2),
            discountedCouponAmount: totalCouponProductDiscount.toFixed(2),
        };
    }

}


export function applyDiscount(originalPrice, discountPercentage) {
    const parsedOriginalPrice = parseFloat(originalPrice);
    const parsedDiscountPercentage = parseFloat(discountPercentage);

    if (isNaN(parsedOriginalPrice) || isNaN(parsedDiscountPercentage)) {
        return 0
    }

    const discountDecimal = parsedDiscountPercentage / 100;
    const discountedPrice = parsedOriginalPrice - (parsedOriginalPrice * discountDecimal);

    const roundedDiscountedPrice = Math.round(discountedPrice * 100) / 100;

    return roundedDiscountedPrice;
}




//product all calculation here 
export const calculateSubTotalAmountWithShippingCostAndCouponProductsDiscount = (
    { cartsProducts = [],
        dbProducts = [],
        couponProductsArr = [],
        freeShippingCost = 0,
        shippingCost = 0,
        couponPercent = 0,
        enableAllProducts,
        selectedShippingOption,
        excludeProducts = []
    }
) => {


    console.log(selectedShippingOption)
    const totalQuantityItems = getTotalSumProductQuantity(cartsProducts, dbProducts);
    const totalSaving = getProductQuantityToTotalSaving(cartsProducts, dbProducts, selectedShippingOption);
    const subTotalPrice = SumTotalProductPrice(cartsProducts, dbProducts, selectedShippingOption);
    // const shipCharge = totalQuantityItems
    //     ? shippingCost || 0
    //     : totalQuantityItems || 0;

    console.log("COUPON PROUCTS:::::::",enableAllProducts? dbProducts.filter((e)=>!(excludeProducts.map((p)=>p.toString()).includes(e._id.toString())) )  :couponProductsArr)
    const result = calculateTotalAmountWithCouponProducts(
        dbProducts,
        cartsProducts,
        enableAllProducts? dbProducts.filter((e)=>!excludeProducts.map((p)=>p.toString()).includes(e._id.toString())).map((e)=>e._id)  :couponProductsArr,
        0,
        couponPercent,
        false,//enableAllProducts,
        selectedShippingOption
    );

    console.log("RESULT::",result)

    const shippingInfo = freeShippingCheck(
        (parseFloat(subTotalPrice)-parseFloat(result.discountedCouponAmount)).toFixed(2),
        freeShippingCost,
        shippingCost
    );

    result.finalAmount = parseFloat(result.finalAmount)+ (parseFloat(shippingInfo.shippingCost||0) || 0);

    shippingInfo["shipCharge"] = parseFloat(shippingInfo?.shippingCost) || 0;
    const obj = {
        totalQuantityItems,
        subTotalPrice,
        totalPrice: result.finalAmount,
        shippingInfo,
        totalSaving,
        ...result,
        selectedShippingOption
    }

    return obj;
};


export const validProducts = (dbProducts, cartsProducts, shippingSelect) => {
    const validProducts = [];

    for (const dbP of dbProducts) {
        if (cartsProducts.some(cartP => cartP?.product?.toString() == dbP?._id?.toString())) {
            const matchProduct = cartsProducts.find(ctMatch => ctMatch?.product?.toString() == dbP?._id?.toString())
            if (dbP?.availability?.isInternational === true) {
                validProducts.push(matchProduct)
            } else {
                if (isValidArray(dbP?.availability?.countries) && dbP?.availability?.countries.some(item => item?.country?.value == shippingSelect?.value)) {
                    validProducts.push(matchProduct)
                }
            }
        }
    }

    return validProducts

}