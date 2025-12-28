import mongoose from "mongoose";
import { customerControllerMessages } from "../../common/index.js";
import CategoryModel from "../../models/Category.model.js";
import FreeBuyModel from "../../models/FreeBuy.model.js";
import OrderModel from "../../models/Order.model.js";
import ProductModel from "../../models/Product.model.js";
import ShippingCountryModel from "../../models/Setting/ShippingCountry.model.js";
import ShippingSettingModel from "../../models/Setting/ShippingOptionSetting.model.js";
import { responseError, responseSuccess } from "../../utils/index.js";

import moment from "moment";
import AppInfoSettingModel from "../../models/Setting/AppInfoSetting.model.js";
import LargeDiscountProductModel from "../../models/LargeDiscountProduct.model.js";
// export const claimFreeBuyThresholdBy = async (req, res, next) => {
//     try {
//         let { totalAmount, shippingOption } = req.body;
//         const existShippingOption = await ShippingSettingModel.findOne({ _id: shippingOption?._id }).lean()
//         if (!existShippingOption?._id) return res.status(400).json(responseError("Shipping option is required!"))
//         totalAmount = Number(parseFloat(totalAmount).toFixed(2))

//         if (totalAmount == 'NaN') return res.status(400).json(responseError(customerControllerMessages.freeBuy.claimFreeBuyThresholdBy.invalidAmount))
//         let data = await FreeBuyModel.find({
//             $expr: {
//                 $gt: [{ $toDouble: "$minimumThreshold" }, Number(totalAmount)]
//             }, isActive: true
//         }, { lastActionByAdmin: 0, createdByAdmin: 0 }).sort("minimumThreshold").populate([
//             {
//                 path: "freeProduct",
//                 select: { /* Specify the fields you want to select for products */ },
//                 populate: [
//                     {
//                         path: "availability.countries",
//                         select: { /* Specify the fields you want to select for countries */ }, model: ShippingCountryModel
//                     },
//                     { path: "categories", select: { /* Specify the fields you want to select for categories */ }, model: CategoryModel }
//                 ]
//             }])
//             .lean()

//         data = data.find(item => {
//             if (item?.freeProduct?.availability?.isInternational === true && item?.freeProduct?.isSoldOut === false) {
//                 return item;
//             } else if (isValidArray(item?.freeProduct?.availability?.countries) && item?.freeProduct?.availability?.countries.some(subItem => subItem?.country?.value == shippingOption?.value && item?.freeProduct?.isSoldOut === false)) {
//                 return item
//             }
//         })

//         let freeClaimProduct = await FreeBuyModel.find({
//             $expr: {
//                 $lte: [{ $toDouble: "$minimumThreshold" }, Number(totalAmount)]
//             }, isActive: true
//         }, { lastActionByAdmin: 0, createdByAdmin: 0 }).sort("minimumThreshold").populate([
//             {
//                 path: "freeProduct",
//                 select: { /* Specify the fields you want to select for products */ },
//                 populate: [
//                     {
//                         path: "availability.countries",
//                         select: { /* Specify the fields you want to select for countries */ }, model: ShippingCountryModel
//                     },
//                     { path: "categories", select: { /* Specify the fields you want to select for categories */ }, model: CategoryModel }
//                 ]
//             }])
//             .lean()
//         freeClaimProduct = freeClaimProduct.find(item => {
//             if (item?.freeProduct?.availability?.isInternational === true && item?.freeProduct?.isSoldOut === false) {
//                 return item;
//             } else if (isValidArray(item?.freeProduct?.availability?.countries) && item?.freeProduct?.availability?.countries.some(subItem => subItem?.country?.value == shippingOption?.value && item?.freeProduct?.isSoldOut === false)) {
//                 return item
//             }
//         })

//         if (!data?._id && !freeClaimProduct?._id) {
//             return res.status(400).json(responseError(customerControllerMessages.freeBuy.claimFreeBuyThresholdBy.errorMsg))
//         }

//        if(!data?._id){
//         data ={}
//        }
//        if(data?._id){
//         data.needSpendAmount = parseFloat(Number(data?.minimumThreshold)-Number(totalAmount)).toFixed(2)
//        }
//       if(!freeClaimProduct?._id){
//        freeClaimProduct = {};
//       }
//         return res.status(200).json(responseSuccess(customerControllerMessages.freeBuy.claimFreeBuyThresholdBy.successMsg, {freeClaimProduct,needSpendToGetFreeProduct:data}))
//     } catch (error) {
//         console.log(error)
//         return res.status(400).json(responseError(customerControllerMessages.freeBuy.claimFreeBuyThresholdBy.errorMsg))
//     }
// }


// export const claimFreeBuyThresholdByOldCode = async (req, res, next) => {
//     try {
//         let { totalAmount, site, shippingOption } = req.body;
//         const query = {

//         }

//         if (site !== "all" && site !== "" && site) {
//             query['site'] = site.trim()
//         }
//         const existShippingOption = await ShippingSettingModel.findOne({ ...query, _id: shippingOption?._id }).lean()
//         if (!existShippingOption?._id) return res.status(400).json(responseError("Shipping option is required!"))
//         totalAmount = Number(parseFloat(totalAmount).toFixed(2))

//         if (totalAmount == 'NaN') return res.status(400).json(responseError(customerControllerMessages.freeBuy.claimFreeBuyThresholdBy.invalidAmount))
//         let data = await FreeBuyModel.find({
//             ...query,
//             $expr: {
//                 $gt: [{ $toDouble: "$minimumThreshold" }, Number(totalAmount)]
//             }, isActive: true
//         }, { lastActionByAdmin: 0, createdByAdmin: 0 }).sort("minimumThreshold").populate([
//             {
//                 path: "freeProducts",
//                 select: { /* Specify the fields you want to select for products */ },
//                 populate: [
//                     {
//                         path: "availability.countries",
//                         select: { /* Specify the fields you want to select for countries */ }, model: ShippingCountryModel
//                     },
//                     { path: "categories", select: { /* Specify the fields you want to select for categories */ }, model: CategoryModel }
//                 ]
//             }])
//             .lean()

//         data.sort((a, b) => parseFloat(a.minimumThreshold) < parseFloat(b.minimumThreshold) ? -1 : 1);
//         console.log("data::::", data)
//         data = data[0];

//         // data = data.find(item => {
//         //     if (item?.freeProduct?.availability?.isInternational === true && item?.freeProduct?.isSoldOut === false) {
//         //         return item;
//         //     } else if (isValidArray(item?.freeProduct?.availability?.countries) && item?.freeProduct?.availability?.countries.some(subItem => subItem?.country?.value == shippingOption?.value && item?.freeProduct?.isSoldOut === false)) {
//         //         return item
//         //     }
//         // })

//         let freeClaimProduct = (await FreeBuyModel.find({
//             ...query,
//             $expr: {
//                 $lte: [{ $toDouble: "$minimumThreshold" }, Number(totalAmount)]
//             }, isActive: true
//         }, { lastActionByAdmin: 0, createdByAdmin: 0 }).sort({ "minimumThreshold": -1 }).populate([
//             {
//                 path: "freeProducts",
//                 select: { /* Specify the fields you want to select for products */ },
//                 populate: [
//                     {
//                         path: "availability.countries",
//                         select: { /* Specify the fields you want to select for countries */ }, model: ShippingCountryModel
//                     },
//                     { path: "categories", select: { /* Specify the fields you want to select for categories */ }, model: CategoryModel }
//                 ]
//             }])
//             .lean())

//         freeClaimProduct.sort((a, b) => parseFloat(b.minimumThreshold) < parseFloat(a.minimumThreshold) ? -1 : 1);
//         console.log(freeClaimProduct)

//         freeClaimProduct = freeClaimProduct[0];
//         // freeClaimProduct = freeClaimProduct.find(item => {
//         //     if (item?.freeProduct?.availability?.isInternational === true && item?.freeProduct?.isSoldOut === false) {
//         //         return item;
//         //     } else if (isValidArray(item?.freeProduct?.availability?.countries) && item?.freeProduct?.availability?.countries.some(subItem => subItem?.country?.value == shippingOption?.value && item?.freeProduct?.isSoldOut === false)) {
//         //         return item
//         //     }
//         // })

//         if (!data?._id && !freeClaimProduct?._id) {
//             return res.status(400).json(responseError(customerControllerMessages.freeBuy.claimFreeBuyThresholdBy.errorMsg))
//         }

//         if (!data?._id) {
//             data = {}
//         }

//         if (data?._id) {
//             data.needSpendAmount = parseFloat(Number(data?.minimumThreshold) - Number(totalAmount)).toFixed(2)
//         }
//         if (!freeClaimProduct?._id) {
//             freeClaimProduct = {};
//         }
//         return res.status(200).json(responseSuccess(customerControllerMessages.freeBuy.claimFreeBuyThresholdBy.successMsg, { freeClaimProduct, needSpendToGetFreeProduct: data }))
//     } catch (error) {
//         console.log(error)
//         return res.status(400).json(responseError(customerControllerMessages.freeBuy.claimFreeBuyThresholdBy.errorMsg))
//     }
// }


export const claimFreeBuyThresholdBy = async (req, res, next) => {
    try {
        let { totalAmount, site, shippingOption } = req.body;
        const query = {}

        if (site !== "all" && site !== "" && site) {
            query['site'] = site.trim()
        }
        const existShippingOption = await ShippingSettingModel.findOne({ ...query, _id: shippingOption?._id }).lean()
        if (!existShippingOption?._id) return res.status(400).json(responseError("Shipping option is required!"))
        totalAmount = Number(parseFloat(totalAmount).toFixed(2))

        if (totalAmount == 'NaN') return res.status(400).json(responseError(customerControllerMessages.freeBuy.claimFreeBuyThresholdBy.invalidAmount))
        
        const customerId = req?.customer?._id;
        
        if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
            return res.status(400).json(responseError('Please login before claiming this freebie!'));
        }
        
        // Restriction query to filter products based on customer's access - same as getAllFreeBies
        const restrictionQuery = {
            $or: [
                { "restrictOptions.isRestricted": false }, // Non-restricted products 
                {
                    "restrictOptions.isRestricted": true,
                    "restrictOptions.customers": { $in: [new mongoose.Types.ObjectId(customerId)] }
                }
            ]
        };
        
        // Common aggregation pipeline for product lookup
        const productLookupPipeline = [
            {
                $lookup: {
                    from: 'products',
                    localField: 'freeProducts',
                    foreignField: '_id',
                    pipeline: [
                        {
                            $match: {
                                $and: [
                                    restrictionQuery,
                                    { isSoldOut: { $ne: true }, isActive: { $ne: false } }
                                ]
                            }
                        }
                    ],
                    as: 'freeProducts'
                }
            },
            { $match: { 'freeProducts.0': { $exists: true } } },
            {
                $lookup: {
                    from: 'shippingcountries',
                    localField: 'freeProducts.availability.countries',
                    foreignField: '_id',
                    as: 'countries'
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'freeProducts.categories',
                    foreignField: '_id',
                    as: 'productCategories'
                }
            },
            {
                $addFields: {
                    freeProducts: {
                        $map: {
                            input: '$freeProducts',
                            as: 'product',
                            in: {
                                $mergeObjects: [
                                    '$$product',
                                    {
                                        categories: {
                                            $filter: {
                                                input: '$productCategories',
                                                as: 'category',
                                                cond: {
                                                    $in: ['$$category._id', '$$product.categories']
                                                }
                                            }
                                        },
                                        availability: {
                                            $mergeObjects: [
                                                '$$product.availability',
                                                {
                                                    countries: {
                                                        $filter: {
                                                            input: '$countries',
                                                            as: 'country',
                                                            cond: {
                                                                $in: ['$$country._id', '$$product.availability.countries']
                                                            }
                                                        }
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    countries: 0,
                    productCategories: 0
                }
            }
        ];
        
        // Get products that need more spending to reach threshold
        let needSpendToGetFreeProduct = await FreeBuyModel.aggregate([
            {
                $match: {
                    ...query,
                    $expr: { $gt: [{ $toDouble: "$minimumThreshold" }, Number(totalAmount)] },
                    isActive: true
                }
            },
            ...productLookupPipeline,
            { $sort: { minimumThreshold: 1 } },
            { $limit: 1 }
        ]);
        
        // Get products that can be claimed with current amount
        let freeClaimProduct = await FreeBuyModel.aggregate([
            {
                $match: {
                    ...query,
                    $expr: { $lte: [{ $toDouble: "$minimumThreshold" }, Number(totalAmount)] },
                    isActive: true
                }
            },
            ...productLookupPipeline,
            { $sort: { minimumThreshold: -1 } },
            { $limit: 1 }
        ]);
        
        let data = needSpendToGetFreeProduct[0] || {};
        freeClaimProduct = freeClaimProduct[0] || {};
        
        if (!data?._id && !freeClaimProduct?._id) {
            return res.status(400).json(responseError(customerControllerMessages.freeBuy.claimFreeBuyThresholdBy.errorMsg))
        }
        
        if (data?._id) {
            data.needSpendAmount = parseFloat(Number(data?.minimumThreshold) - Number(totalAmount)).toFixed(2)
        }
        
        return res.status(200).json(responseSuccess(customerControllerMessages.freeBuy.claimFreeBuyThresholdBy.successMsg, { freeClaimProduct, needSpendToGetFreeProduct: data }))
    } catch (error) {
        console.log(error)
        return res.status(400).json(responseError(customerControllerMessages.freeBuy.claimFreeBuyThresholdBy.errorMsg))
    }
}



// get list of products that should not return to user.
async function restricedProducts(req) {
    const customerId = req?.customer?._id || null;
    const productIds = await ProductModel.find({
        "restrictOptions.isRestricted": true,
        isActive: true,
        site: req.query.site || "hb",
    }).lean().distinct('_id');

    const baseRestrictedQueryByOrder = { customer: customerId, "products.product": { $in: productIds }, site: req.query.site || "hb", status: { $nin: ['CANCELLED', 'PENDING', 'FAILED'] }, "payment.isPaymentCompleted": true, isTestOrder: false }

    const matchingOrders = await OrderModel.find(baseRestrictedQueryByOrder);

    const productMapToTrackRestriction = {};

    for (let o of matchingOrders) {
        for (let p of productIds) {
            if (o.products.map((e) => e.product.toString()).includes(p.toString())) {
                productMapToTrackRestriction[p.toString()] = (productMapToTrackRestriction[p.toString()] || 0) + 1;
            }
        }
    }

    const retrictionPassProductIds = [];
    for (let k of Object.keys(productMapToTrackRestriction)) {
        if (productMapToTrackRestriction[k] >= 2) {
            retrictionPassProductIds.push(k);
        }
    }
    console.log(retrictionPassProductIds, productIds)
    return productIds.filter((e) => !retrictionPassProductIds.includes(e.toString())).map((e) => e.toString());
}

export const getAllFreeBies = async (req, res, next) => {
    try {
        const { site = 'hb' } = req.query
        const query = {
            isActive: true,
        }
        if (site !== "all" && site !== "" && site) {
            query['site'] = site.trim()
        }

        const customerId = req?.customer?._id;

        if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
            return res.status(400).json(responseError('Please login before access this freebie!'));
        }

        // Restriction query to filter products based on customer's access
        const restrictionQuery = {
            $or: [
                { "restrictOptions.isRestricted": false }, // Non-restricted products 
                {
                    "restrictOptions.isRestricted": true,
                    "restrictOptions.customers": { $in: [new mongoose.Types.ObjectId(customerId)] }
                }
            ]
        };

        // Use aggregation for better performance and to filter out empty freeProducts
        const data = await FreeBuyModel.aggregate([
            // Match initial query conditions
            { $match: { ...query } },

            // Lookup and filter products in one step
            {
                $lookup: {
                    from: 'products',
                    localField: 'freeProducts',
                    foreignField: '_id',
                    pipeline: [
                        // Match _id first for better index usage, then apply restriction filters
                        {
                            $match: {
                                $and: [
                                    restrictionQuery,
                                    { isSoldOut: { $ne: true }, isActive: { $ne: false } } // Filter out sold out and inactive products
                                ]
                            }
                        }
                    ],
                    as: 'freeProducts'
                }
            },

            // Only return documents that have at least one product after filtering
            { $match: { 'freeProducts.0': { $exists: true } } },

            // Lookup countries and categories for products
            // Store the results in temporary fields that we'll use later
            {
                $lookup: {
                    from: 'shippingcountries',
                    localField: 'freeProducts.availability.countries',
                    foreignField: '_id',
                    as: 'countries'
                }
            },

            {
                $lookup: {
                    from: 'categories',
                    localField: 'freeProducts.categories',
                    foreignField: '_id',
                    as: 'productCategories'
                }
            },

            // Use $addFields and $map to properly populate the nested fields
            // while preserving all other product data
            {
                $addFields: {
                    freeProducts: {
                        $map: {
                            input: '$freeProducts',
                            as: 'product',
                            in: {
                                $mergeObjects: [
                                    '$$product',
                                    {
                                        // Populate categories with full category objects
                                        categories: {
                                            $filter: {
                                                input: '$productCategories',
                                                as: 'category',
                                                cond: {
                                                    $in: ['$$category._id', '$$product.categories']
                                                }
                                            }
                                        },
                                        // Preserve the availability structure but populate countries
                                        availability: {
                                            $mergeObjects: [
                                                '$$product.availability',
                                                {
                                                    countries: {
                                                        $filter: {
                                                            input: '$countries',
                                                            as: 'country',
                                                            cond: {
                                                                $in: ['$$country._id', '$$product.availability.countries']
                                                            }
                                                        }
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },

            // Remove the temporary fields from the final output
            {
                $project: {
                    countries: 0,
                    productCategories: 0
                }
            }
        ]);

        console.log(data, "freebie products")
        return res.status(200).json(responseSuccess(customerControllerMessages.freeBuy.claimFreeBuyThresholdBy.successMsg, data))
    } catch (error) {
        console.log("error", error);
        return res.status(400).json(responseError(customerControllerMessages.freeBuy.claimFreeBuyThresholdBy.errorMsg))
    }
}





export const getAllMonthlyFreeBies = async (req, res, next) => {
    try {
        const { site = 'hb', thresholdAmount } = req.query;

        const query = {
            isActive: true,
        };

        if (site !== "all" && site !== "" && site) {
            query.site = site.trim();
        }

        // Add threshold filter if provided - Fixed logic
        if (thresholdAmount && !isNaN(thresholdAmount)) {
            // Show freebies that can be claimed with the given threshold amount
            query.$expr = {
                $gte: [{ $toDouble: "$minimumThreshold" }, Number(thresholdAmount)]
            };
        }

        const customerId = req?.customer?._id;

        if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
            return res.status(400).json(responseError('Please login before access this freebie!'));
        }

        // Product restriction logic
        const restrictionQuery = {
            $or: [
                { "restrictOptions.isRestricted": false },
                {
                    "restrictOptions.isRestricted": true,
                    "restrictOptions.customers": { $in: [new mongoose.Types.ObjectId(customerId)] }
                }
            ]
        };

        const data = await FreeBuyModel.aggregate([
            // Match active FreeBuy with threshold filter
            {
                $match: query
            },

            // Lookup and filter products based on restriction
            {
                $lookup: {
                    from: 'products',
                    localField: 'freeProducts',
                    foreignField: '_id',
                    pipeline: [
                        {
                            $match: {
                                $and: [
                                    restrictionQuery,
                                    { isSoldOut: { $ne: true }, isActive: { $ne: false } }
                                ]
                            }
                        }
                    ],
                    as: 'freeProducts'
                }
            },

            // Only include FreeBuy entries that have at least one valid product
            { $match: { 'freeProducts.0': { $exists: true } } },

            // Lookup categories for products
            {
                $lookup: {
                    from: 'categories',
                    localField: 'freeProducts.categories',
                    foreignField: '_id',
                    as: 'productCategories'
                }
            },

            // Populate products with category data (removed country logic)
            {
                $addFields: {
                    freeProducts: {
                        $map: {
                            input: '$freeProducts',
                            as: 'product',
                            in: {
                                $mergeObjects: [
                                    '$$product',
                                    {
                                        categories: {
                                            $filter: {
                                                input: '$productCategories',
                                                as: 'category',
                                                cond: {
                                                    $in: ['$$category._id', '$$product.categories']
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },

            // Clean up temporary join data
            {
                $project: {
                    productCategories: 0
                }
            },

            // Sort by minimumThreshold ascending
            {
                $sort: { minimumThreshold: 1 }
            }
        ]);

        console.log(data, "freebie products");
        return res.status(200).json(
            responseSuccess(customerControllerMessages.freeBuy.claimFreeBuyThresholdBy.successMsg, data)
        );
    } catch (error) {
        console.log("error", error);
        return res.status(400).json(
            responseError(customerControllerMessages.freeBuy.claimFreeBuyThresholdBy.errorMsg)
        );
    }
};




export const getThresholdRanges = async (req, res, next) => {
    try {
        const { site = 'hb' } = req.query;
        
        const query = {
            isActive: true,
        };

        if (site !== "all" && site !== "" && site) {
            query.site = site.trim();
        }

        const customerId = req?.customer?._id;

        if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
            return res.status(400).json(responseError('Please login before access this freebie!'));
        }

        // Product restriction logic
        const restrictionQuery = {
            $or: [
                { "restrictOptions.isRestricted": false },
                {
                    "restrictOptions.isRestricted": true,
                    "restrictOptions.customers": { $in: [new mongoose.Types.ObjectId(customerId)] }
                }
            ]
        };

        const largeDiscountProducts =await LargeDiscountProductModel.aggregate([
            // Match active FreeBuy with threshold filter
            {
                $match: {isActive:true}
            },

            // Lookup and filter products based on restriction
            {
                $lookup: {
                    from: 'products',
                    localField: 'largeDiscountProducts',
                    foreignField: '_id',
                    pipeline: [
                        {
                          $match: {
                            $and: [
                              restrictionQuery,
                            ],
                            isSoldOut: { $ne: true },
                            isActive: { $ne: false },
                            'bundle.isLimited': { $ne: true },
                            'cycle.isCycle': { $ne: true },
                            isGeneral: { $ne: false }
                          }
                        }
                      ],
                    as: 'largeDiscountProducts'
                }
            },

            // Only include FreeBuy entries that have at least one valid product
            { $match: { 'largeDiscountProducts.0': { $exists: true } } },

            // Lookup categories for products
            {
                $lookup: {
                    from: 'categories',
                    localField: 'largeDiscountProducts.categories',
                    foreignField: '_id',
                    as: 'productCategories'
                }
            },

            // Populate products with category data (removed country logic)
            {
                $addFields: {
                    largeDiscountProducts: {
                        $map: {
                            input: '$largeDiscountProducts',
                            as: 'product',
                            in: {
                                $mergeObjects: [
                                    '$$product',
                                    {
                                        categories: {
                                            $filter: {
                                                input: '$productCategories',
                                                as: 'category',
                                                cond: {
                                                    $in: ['$$category._id', '$$product.categories']
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },

            // Clean up temporary join data
            {
                $project: {
                        productCategories: 0
                }
            },

            // Sort by product discount to top price.sale price.regular price.discount
            {
                $sort: { "largeDiscountProducts.price.discount": -1 }
            }
        ]);

        // Get unique threshold values from FreeBuy entries that have valid products
        const thresholds = await FreeBuyModel.aggregate([
            // Match active FreeBuy entries
            { $match: query },

            // Lookup and filter products based on restriction
            {
                $lookup: {
                    from: 'products',
                    localField: 'freeProducts',
                    foreignField: '_id',
                    pipeline: [
                        {
                            $match: {
                                $and: [
                                    restrictionQuery,
                                    { isSoldOut: { $ne: true }, isActive: { $ne: false } }
                                ]
                            }
                        }
                    ],
                    as: 'freeProducts'
                }
            },

            // Only include FreeBuy entries that have at least one valid product
            { $match: { 'freeProducts.0': { $exists: true } } },

            // Group by threshold to get unique values
            {
                $group: {
                    _id: null,
                    thresholds: { $addToSet: { $toDouble: "$minimumThreshold" } }
                }
            },

            // Project only the thresholds array
            {
                $project: {
                    _id: 0,
                    thresholds: 1
                }
            }
        ]);

        let thresholdValues = [];
        if (thresholds.length > 0 && thresholds[0].thresholds) {
            // Sort thresholds in ascending order
            thresholdValues = thresholds[0].thresholds.sort((a, b) => a - b);
        }

        // Create dropdown options
        const thresholdOptions = [
            { label: 'All Freebies', value: 0 },
            ...thresholdValues.map(threshold => ({
                label: `>= $${threshold}`,
                value: threshold
            }))
        ];


        const appInfoSetting = await AppInfoSettingModel.findOne({}).sort("-updatedAt").lean();
        // console.log(appInfoSetting,"appInfoSetting");
        return res.status(200).json(
            responseSuccess('Threshold ranges fetched successfully', {
                thresholds: thresholdValues,
                options: thresholdOptions,
                minThreshold: thresholdValues.length > 0 ? Math.min(...thresholdValues) : 0,
                maxThreshold: thresholdValues.length > 0 ? Math.max(...thresholdValues) : 0,
                freebieInfo: appInfoSetting?.freebieInfo,
                largeDiscountProducts:largeDiscountProducts?.length>0?largeDiscountProducts[0]?.largeDiscountProducts||[]:[],
            })
        );
    } catch (error) {
        console.log("error", error);
        return res.status(400).json(
            responseError('Failed to fetch threshold ranges')
        );
    }
};