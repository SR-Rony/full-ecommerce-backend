import { couponCodePercentageModified, customerIdsToModifyCouponCode } from "../../config/constant.js";
import CouponModel from "../../models/Coupon.model.js";
import ProductModel from "../../models/Product.model.js";
import { isValidArray, responseError, responseSuccess, toParseObject } from "../../utils/func.js";
import { isCouponValid } from "../../utils/helpers.js";

// const customerIdsToModifyCouponCode: [
//     {cusotmerId: jflajdfa}
//     ]
//     const cuoponCode = "NEW50"
    
//     modifyCouponCodePercentage(customerObjectId, cuponCode){
//     if couponCode != cuoponCode return currentCouponCode:25
    
//     return {coupounPercentage: 25+10}
//     }


export const modifyCouponCodePercentage = (customerObjectId, couponObj) => {
let coupon = toParseObject(couponObj)
    const matchUserWithCoupon = customerIdsToModifyCouponCode.find((e)=>e?.customerId.toString()==customerObjectId.toString())
    if(!matchUserWithCoupon){
        console.log('coupon not modified',coupon)
        return coupon
    }
    if (!coupon?.code || coupon.code !== couponCodePercentageModified.modifiedCouponCode) {
        console.log('coupon not modified',coupon)
        return coupon
    }
   
    coupon.value += couponCodePercentageModified.modifiedValuePercentage
    console.log('coupon modified 10% added',coupon)
    return coupon
}

export const getCouponByCode = async (req, res, next) => {
    try {
        const { code, site='hb', cartProducts = [] } = req.body;

        const query = {
            code: code, isActive: true
        }

        if (site !== "all" && site !== "" && site) {
            query['site'] = site.trim()
        }
        const coupon = await CouponModel.findOne(query).lean();
        console.log("Coupon",coupon,query)
        if (!coupon?.code) {
            return res.status(400).json(responseError("Coupon not exist!"))
        }
        const result = await isCouponValid(coupon, cartProducts, false);
        if (!result.success) {
            return res.status(400).json(responseError(result.message))
        }

        coupon.bundleNotAllowed = coupon.excludeAllBundleProducts || (coupon.excludeAll3PackTriplePlayBundleProducts && coupon.excludeAll10PackMegaBundleProducts);

        // if products.contain bundle then false.
        if(coupon.products?.length) {
            const isBundleContain = !!(await ProductModel.findOne( { _id: {$in: coupon.products.map((e)=>e?._id || e) },"bundle.isLimited": true }))
            coupon.bundleNotAllowed = !isBundleContain;
        }

        return res.status(200).json(responseSuccess(result.message, modifyCouponCodePercentage(req?.customer?._id, coupon)));
    } catch (error) {
        console.log(error)
        return res.status(400).json(responseError("The coupon has expired.!"))
    }
};



export const getAllValidCoupons = async (req, res, next) => {
    try {
        const { site='hb'} = req.query;

        const query = {
            isActive: true
        }

        if (site !== "all" && site !== "" && site) {
            query['site'] = site.trim()
        }
        const coupons = await CouponModel.find(query).lean();

        const finalData = [];

        for(let c of coupons) {
            const result = await isCouponValid(c,[], true);
            if (result.success) {
                finalData.push(c);
            }
        }

        res.set('Cache-Control', 'public, max-age=600'); // 10min.
        // console.log("finalData",finalData)  

        const modifiedCoupon = isValidArray(finalData)? finalData.map((e)=>modifyCouponCodePercentage(req?.customer?._id, e)) : []; 

        return res.status(200).json(responseSuccess("Success", modifiedCoupon));
    } catch (error) {
        console.log(error)
        return res.status(400).json(responseError("The coupon has expired.!"))
    }
};


export const updateCouponTotalUses = async (req, res, next) => {
    try {
        const { couponId } = req.body;
        const coupon = await CouponModel.findOne({ _id: couponId });
        if (!coupon) {
            return res.status(400).json(responseError("Coupon not exist!"))
        }

        coupon.totalUses += 1;
        await coupon.save();
        return res.status(200).json(responseSuccess('Coupon totalUses updated successfully', coupon))
    } catch (error) {
        console.error(error);
        return res.status(400).json(responseError('Failed to update coupon totalUses'))
    }
};