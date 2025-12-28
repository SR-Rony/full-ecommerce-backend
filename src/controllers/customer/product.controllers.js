import _ from "lodash";
import moment from "moment";
import { customerControllerMessages } from "../../common/index.js";
import { siteType } from "../../config/constant.js";
import { redisClient } from "../../config/db.js";
import { redisCacheVariable } from "../../config/redisCacheVariable.js";
import CategoryModel from "../../models/Category.model.js";
import LabTestedProductModel from "../../models/LabTestedProduct.model.js";
import ProductModel from "../../models/Product.model.js";
import ProductViewModel from "../../models/ProductView.model.js";
import { isValidArray, isValidDate, responseError } from "../../utils/func.js";
import {
  findWithPagination,
  isValidObjectId,
  responseSuccess,
  slugGen,
} from "../../utils/index.js";
import { buildSearchProductQuery } from "../../utils/search_product.js";
import CustomerModel from "../../models/Customer.model.js";
import OrderModel from "../../models/Order.model.js";
// RI Rijan
// 12:31 PM
// PHENTERMINE
// RI Rijan
// 12:55 PM
// customerHasRestrictedProductOrderIds
// RI Rijan
// 12:59 PM
// search
// all products
// category wise page
// home page featured
// new arrival

export const productSingleDetails = async (req, res, next) => {
  try {
    const { site = "hb" } = req.query || "";

    let query = {
      slug: req?.params?.slug,
    };
    if (site !== "all" && site !== "" && site) {
      query["site"] = site.trim();
    }

    const populates = [
      {
        path: "details.includes.product",
        select: {},
      },
      {
        path: "bundle.products",
        select: {},
      },
    ];

    const customerId = req?.customer?._id || null;
    let restrictionQuery = {};
    // const productIds = await ProductModel.find({
    //   "restrictOptions.isRestricted": true,
    //   isActive: true,
    //   site: site,
    // }).lean().distinct('_id');

    // const baseRestrictedQueryByOrder = { customer: customerId, "products.product": { $in: productIds }, site: site, status: { $nin: ['CANCELLED', 'PENDING', 'FAILED'] }, "payment.isPaymentCompleted": true, isTestOrder: false }

    // const matchingOrders = await OrderModel.find(baseRestrictedQueryByOrder)
    //   .select('_id')
    //   .limit(2)
    //   .lean();
    //minimum 2 order is required
    // if (matchingOrders?.length < 2) {
    //   restrictionQuery = {
    //     $or: [
    //       { "restrictOptions.isRestricted": false }, // Non-restricted products
    //     ]
    //   };
    // } else {
    // const customerHasOrderRestrictedProductIds = await OrderModel.find(baseRestrictedQueryByOrder).lean().distinct('products.product');

    // console.log("customerHasOrderRestrictedProductIds", customerHasOrderRestrictedProductIds)
    // Restriction query to filter products based on customer's order history
    // restrictionQuery = {
    //   $or: [
    //     { "restrictOptions.isRestricted": false }, // Non-restricted products
    //     {
    //       "restrictOptions.isRestricted": true,
    //       "_id": { $in: customerHasOrderRestrictedProductIds }
    //     }
    //   ]
    // };
    // }

    //Restriction query to filter products based on customer's
    restrictionQuery = {
      $or: [
        { "restrictOptions.isRestricted": false }, // Non-restricted products
        {
          "restrictOptions.isRestricted": true,
          "restrictOptions.customers": { $in: [customerId] },
        },
      ],
    };
    // Combine search and restriction queries
    if (Object.keys(query).length > 0) {
      // If there's an existing query (e.g., from buildSearchProductQuery), combine with $and
      query = {
        $and: [
          query, // Search query (may contain $or)
          restrictionQuery,
        ],
      };
    } else {
      // If no search query, use restriction query directly
      query = restrictionQuery;
    }

    const data = await ProductModel.findOneAndUpdate(
      query,
      {
        $inc: {
          "stats.viewCount": 1,
        },
      },
      { new: true }
    )
      .populate(populates)
      .select({
        createdByAdmin: 0,
        lastActionByAdmin: 0,
      })
      .lean();
    if (data?._id) {
      await ProductViewModel.create({
        productOwner: data?.lastActionByAdmin || data?.createdByAdmin || null,
        product: data?._id,
        customer: req?.customer?._id || null,
        site: site || "hb",
      });
    }

    if (data?._id) {
      const labTestedProductDetails = await LabTestedProductModel.findOne(
        {
          products: (data?.bundle?.products || [])[0] || data?._id,
          site: site,
        },
        { _id: 1, reportLink: 1 }
      ).lean();
      data["labTested"] = {
        labTestedId: labTestedProductDetails?._id || null,
        reportLink: labTestedProductDetails?.reportLink || null,
        isMatched: labTestedProductDetails?._id ? true : false,
      };
    }
    if (data?.site == "auctropin") {
      const associateBundleProducts = await ProductModel.find({
        ...restrictionQuery,
        "bundle.products": data?._id,
        site: data?.site,
      })
        .sort({ "bundle.size": 1 })
        .populate(populates)
        .select({
          createdByAdmin: 0,
          lastActionByAdmin: 0,
        });
      data["associateBundleProducts"] = associateBundleProducts || [];
    }

    if (data?._id) {
      const customerCheckId = req?.customer?._id || null;

      const productsRestrictOutStocks = [
        "6499b7c8702c5c4c55259a8b",
        "666c33d4b7d8c6b4f53a1251",
      ];
       // Check customer eligibility
      const [databaseCustomer, orderCount] = await Promise.all([
        CustomerModel.findOne({
          _id: customerCheckId,
          createdAt: { $lt: new Date("2025-01-01") }
        }).select("createdAt _id").lean(),
        
        OrderModel.countDocuments({
          customer: customerCheckId,
          status: { $nin: ["CANCELLED", "PENDING", "FAILED"] },
          "payment.isPaymentCompleted": true,
          isTestOrder: false
        })
      ]);
      if (!(databaseCustomer && orderCount>=2) && data?.bundle?.isLimited===false&& productsRestrictOutStocks.includes(data?._id&&data?._id.toString())) {
        data["isSoldOut"] =true
      }
    }
    return res
      .status(200)
      .json(
        responseSuccess(
          data?._id
            ? customerControllerMessages.product.productSingleDetails.successMsg
            : customerControllerMessages.product.productSingleDetails.errorMsg,
          data
        )
      );
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const getBundleProducts = async (req, res, next) => {
  try {
    const { site = "hb" } = req.query;
    let query = {};

    if (site !== "all" && site !== "" && site) {
      query["site"] = site.trim();
    }

    const redisData = await redisClient.get(
      redisCacheVariable.allBundleProducts + `_${site}`
    );
    if (redisData) {
      res.set("Cache-Control", `public, max-age=600`); // 10min
      return res
        .status(200)
        .json(
          responseSuccess(
            customerControllerMessages.product.getPublicProducts.successMsg,
            JSON.parse(redisData)
          )
        );
    }

    const customerId = req?.customer?._id || null;
    let restrictionQuery = {};
    // const productIds = await ProductModel.find({
    //   "restrictOptions.isRestricted": true,
    //   isActive: true,
    //   site: site,
    // }).lean().distinct('_id');

    // const baseRestrictedQueryByOrder = { customer: customerId, "products.product": { $in: productIds }, site: site, status: { $nin: ['CANCELLED', 'PENDING', 'FAILED'] }, "payment.isPaymentCompleted": true, isTestOrder: false }

    // const matchingOrders = await OrderModel.find(baseRestrictedQueryByOrder)
    //   .select('_id')
    //   .limit(2)
    //   .lean();

    //minimum 2 order is required
    // if (matchingOrders?.length < 2) {
    //   restrictionQuery = {
    //     $or: [
    //       { "restrictOptions.isRestricted": false }, // Non-restricted products
    //     ]
    //   };
    // } else {
    // const customerHasOrderRestrictedProductIds = await OrderModel.find(baseRestrictedQueryByOrder).lean().distinct('products.product');

    // console.log("customerHasOrderRestrictedProductIds", customerHasOrderRestrictedProductIds)
    // Restriction query to filter products based on customer's order history
    // restrictionQuery = {
    //   $or: [
    //     { "restrictOptions.isRestricted": false }, // Non-restricted products
    //     {
    //       "restrictOptions.isRestricted": true,
    //       "_id": { $in: customerHasOrderRestrictedProductIds }
    //     }
    //   ]
    // };
    // }

    // Restriction query to filter products based on customer's
    restrictionQuery = {
      $or: [
        { "restrictOptions.isRestricted": false }, // Non-restricted products
        {
          "restrictOptions.isRestricted": true,
          "restrictOptions.customers": { $in: [customerId] },
        },
      ],
    };
    // Combine search and restriction queries
    if (Object.keys(query).length > 0) {
      // If there's an existing query (e.g., from buildSearchProductQuery), combine with $and
      query = {
        $and: [
          query, // Search query (may contain $or)
          restrictionQuery,
        ],
      };
    } else {
      // If no search query, use restriction query directly
      query = restrictionQuery;
    }

    const products = await ProductModel.find({
      ...query,
      "bundle.isLimited": true,
    })
      .sort({ "bundle.size": 1 })
      .populate("bundle.products");
    await redisClient.set(
      redisCacheVariable.allBundleProducts + siteType._hb,
      JSON.stringify(products)
    );
    res.set("Cache-Control", `public, max-age=600`); // 10min
    if (site == siteType._all.slice(1)) {
      const products = await ProductModel.find({
        ...query,
        "bundle.isLimited": true,
      })
        .sort({ "bundle.size": 1 })
        .populate("bundle.products");
      await redisClient.set(
        redisCacheVariable.allBundleProducts + siteType._all,
        JSON.stringify(products)
      );
      res.set("Cache-Control", `public, max-age=600`); // 10min
      return res
        .status(200)
        .json(
          responseSuccess(
            customerControllerMessages.product.getPublicProducts.successMsg,
            products
          )
        );
    }
    if (site == siteType._auctropin.slice(1)) {
      const products = await ProductModel.find({
        ...query,
        "bundle.isLimited": true,
      })
        .sort({ "bundle.size": 1 })
        .populate("bundle.products");
      await redisClient.set(
        redisCacheVariable.allBundleProducts + siteType._auctropin,
        JSON.stringify(products)
      );
      res.set("Cache-Control", `public, max-age=600`); // 10min
      return res
        .status(200)
        .json(
          responseSuccess(
            customerControllerMessages.product.getPublicProducts.successMsg,
            products
          )
        );
    }

    return res
      .status(200)
      .json(
        responseSuccess(
          customerControllerMessages.product.getPublicProducts.successMsg,
          products
        )
      );
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const getPublicProducts = async (req, res, next) => {
  try {
    req.query = _.omitBy(req.query, _.isEmpty);
    let {
      q,
      categories,
      startDate,
      endDate,
      products,
      isAllProduct,
      isHome,
      isFeatured,
      isSoldOut,
      isBundle,
      page,
      sort,
      limit,
    } = req.query;
    const site = req.query.site || "hb";
    // if (req.query.hasOwnProperty('isHome') && isHome === 'true') {
    //   const redisData = await redisClient.get(redisCacheVariable.homeFeaturedProducts + `_${site.trim()}`)
    //   if (redisData) {
    //     res.set('Cache-Control', 'public, max-age=120'); // 2min
    //     return res.status(200).json(responseSuccess(customerControllerMessages.product.getPublicProducts.successMsg, JSON.parse(redisData)))
    //   }
    // }
    // if (req.query.hasOwnProperty('isAllProduct') && isAllProduct === 'true') {
    //   const redisData = await redisClient.get(redisCacheVariable.allProducts + `_${site.trim()}`)
    //   if (redisData) {
    //     return res.status(200).json(responseSuccess(customerControllerMessages.product.getPublicProducts.successMsg, JSON.parse(redisData)))
    //   }
    // }

    const options = {
      model: ProductModel,
      query: {},
      sort: {},
      select: {
        createdByAdmin: 0,
        lastActionByAdmin: 0,
      },
      page: page || 1,
      limit: req.query.isSavings ? 500 : limit || 12,
      hint: null,
      populate: [
        {
          path: "categories",
          select: {},
        },
        {
          path: "availability.countries",
          select: {},
        },
        {
          path: "details.includes.product",
          select: {},
        },
        {
          path: "bundle.products",
          select: {},
        },
      ],
    };

    if (q) {
      options.query = buildSearchProductQuery(q);
    }
    if (site !== "all" && site !== "" && site) {
      options.query["site"] = site.trim();
    }

    const customerId = req?.customer?._id || null;
    let restrictionQuery = {};

    //old code start
    // const matchingOrders = await OrderModel.find(baseRestrictedQueryByOrder);

    // const productMapToTrackRestriction = {};

    // for(let o of matchingOrders) {
    //   for(let p of productIds) {
    //     if(o.products.map((e)=>e.product.toString()).includes(p.toString()) ) {
    //       productMapToTrackRestriction[p.toString()] = (productMapToTrackRestriction[p.toString()] || 0)+1;
    //     }
    //   }
    // }

    // const retrictionPassProductIds = [];
    // for(let k of Object.keys(productMapToTrackRestriction)) {
    //   // if(productMapToTrackRestriction[k]>=2) {
    //     retrictionPassProductIds.push(k);
    //   // }
    // }
    //old code end

    // Restriction query to filter products based on customer's
    restrictionQuery = {
      $or: [
        { "restrictOptions.isRestricted": false }, // Non-restricted products
        {
          "restrictOptions.isRestricted": true,
          "restrictOptions.customers": { $in: [customerId] },
        },
      ],
    };

    // Combine search and restriction queries
    if (Object.keys(options.query).length > 0) {
      // If there's an existing query (e.g., from buildSearchProductQuery), combine with $and
      options.query = {
        $and: [
          options.query, // Search query (may contain $or)
          restrictionQuery,
        ],
      };
    } else {
      // If no search query, use restriction query directly
      options.query = restrictionQuery;
    }

    if (startDate && endDate) {
      if (!isValidDate(startDate)) {
        return res
          .status(400)
          .json(
            responseError(
              customerControllerMessages.product.getPublicProducts
                .startDateInvalid
            )
          );
      }
      if (!isValidDate(endDate)) {
        return res
          .status(400)
          .json(
            responseError(
              customerControllerMessages.product.getPublicProducts
                .endDateInvalid
            )
          );
      }
      options.query["createdAt"] = {
        $gte: moment(startDate).startOf("day").toDate(),
        $lte: moment(endDate).endOf("day").toDate(),
      };
    }
    const validProductsIds = Array.from(
      new Set(
        (products || "")
          .split(",")
          .map((id) => id.trim())
          .filter((item) => isValidObjectId(item))
      )
    );

    if (validProductsIds.length) {
      options.query["_id"] = { $in: validProductsIds };
    }

    if (
      req.query.hasOwnProperty("categories") &&
      req.query?.categories !== "all"
    ) {
      if (req.query.categories === "neobio") {
        options.query["topMenuCategory"] = "neobio";
      } else if (typeof req.query.categories === "string") {
        const filteredArray = req.query.categories.split(",");
        const filtered = filteredArray
          .map((item) => slugGen(item))
          .filter(Boolean);
        if (filtered.length) {
          let ids = await CategoryModel.find(
            { slug: { $in: filtered } },
            { _id: 1 }
          ).lean();
          if (ids?.length) {
            ids = ids.map((item) => item?._id);
            options.query["categories"] = { $in: ids };
          }
        }
      }
    }

    if (
      req.query.hasOwnProperty("isFeatured") &&
      req.query?.isFeatured !== ""
    ) {
      const isFeatured = req.query.isFeatured === "true";
      options.query["featured.on"] = isFeatured;
      if (isFeatured) {
        options.sort = { "featured.priority": -1 };
      }
    }

    options.query["isActive"] = true;

    if (
      (req.query.hasOwnProperty("isBundle") && req.query?.isBundle !== "") ||
      (req.query.hasOwnProperty("isSavings") && req.query?.isSavings !== "")
    ) {
      options.query["bundle.isLimited"] =
        req.query.isBundle === "true" || !!req.query.isSavings;
    }

    if (req.query.hasOwnProperty("isSoldOut") && req.query?.isSoldOut !== "") {
      options.query["isSoldOut"] = req.query.isSoldOut === "true";
    }
    if (
      req.query.hasOwnProperty("hasWarningFlag") &&
      req.query?.hasWarningFlag !== "all" &&
      req.query?.hasWarningFlag !== ""
    ) {
      options.query["hasWarningFlag"] = req.query.hasWarningFlag === "true";
    }
    if (sort) {
      switch (sort) {
        case "latest":
          options.sort = { createdAt: -1 };
          break;
        case "featured":
          options.sort = { "featured.priority": -1 };
          break;
        case "oldest":
          options.sort = { createdAt: 1 };
          break;
        case "mostSale":
          options.sort = { "stats.totalSoldCount": -1 };
          break;
        case "mostViewed":
          options.sort = { "stats.viewCount": -1 };
          break;
        case "mostRated":
          options.sort = { "ratingInfo.avgRating": -1 };
          break;
        case "mostBundle":
          options.sort = { "price.discount": -1 };
          break;
        case "priceLow":
          options.sort = { "price.regular": 1 };
          break;
        case "priceHigh":
          options.sort = { "price.regular": -1 };
          break;
        default:
          options.sort = { createdAt: -1 }; // Default to latest
      }
    }

    if (req.query.hasOwnProperty("isAllProduct") && isAllProduct === "true") {
      options.query = {
        site,
        ...restrictionQuery,
      };
      options.page = 1;
      options.limit = 50000;
    } else if (req.query.hasOwnProperty("isHome") && isHome === "true") {
      if (site == "auctropin") {
        options.query["bundle.isLimited"] = false;
      }
      options.sort = { "featured.priority": -1 };
    }

    if (req.query.isSavings) {
      options.sort = { "bundle.size": -1 };
    }

    options.sort = {
      "bundle.isLimited": 1,
      ...options.sort,
    };

    if (req.query.isFeatured != "true") {
      options.sort = {
        title: 1,
        "bundle.size": 1,
      };
    }

    //console.log("query",options.query['$and'][0]);
    const data = await findWithPagination(options);
    if (isValidArray(data?.data)) {
      const productIds = [
        ...new Set(
          data.data.map(
            (item) =>
              (item.bundle?.products || [])[0]?._id?.toString() ||
              item._id.toString()
          )
        ),
      ]; // Unique product IDs
      const labTestedProducts = await LabTestedProductModel.find({
        products: { $in: productIds },
      }).lean();
      // console.log(labTestedProducts,"labTestedProducts")
      const labTestedProductMap = new Map(
        labTestedProducts.map((item) => [item.products.toString(), item])
      );
      data.data = data.data.map((item) => ({
        ...item,
        labTestedProduct:
          labTestedProductMap.get(
            (item.bundle?.products || [])[0]?._id?.toString() ||
              item._id.toString()
          ) || null,
      }));
    } else {
      data.data = [];
    }


    if(data?.data?.length) {
      const customerCheckId = req?.customer?._id || null;

      const productsRestrictOutStocks = [
        "6499b7c8702c5c4c55259a8b",
        "666c33d4b7d8c6b4f53a1251"
      ];

      // Check customer eligibility
      const [databaseCustomer, orderCount] = await Promise.all([
        CustomerModel.findOne({
          _id: customerCheckId,
          createdAt: { $lt: new Date("2025-01-01") }
        }).select("createdAt _id").lean(),
        
        OrderModel.countDocuments({
          customer: customerCheckId,
          status: { $nin: ["CANCELLED", "PENDING", "FAILED"] },
          "payment.isPaymentCompleted": true,
          isTestOrder: false
        })
      ]);

      // Update isSoldOut flag for restricted products
      console.log("databaseCustomer",databaseCustomer,"orderCount",orderCount);
      data.data = data.data.map(item => {
        const itemId = item?._id?.toString();
        if(!(databaseCustomer && orderCount>=2) && item?.bundle?.isLimited===false && itemId && productsRestrictOutStocks.includes(itemId)) {
          return {
            ...item,
            isSoldOut: true
          };
        }
        return item;
      });

      // Cache home featured products
      if (req.query.hasOwnProperty("isHome") && isHome === "true") {
        const cacheKey = redisCacheVariable.homeFeaturedProducts;
        
        if (site === siteType._all.slice(1)) {
          await redisClient.set(cacheKey + siteType._all, JSON.stringify(data));
        } else if (site === siteType._auctropin.slice(1)) {
          await redisClient.set(cacheKey + siteType._auctropin, JSON.stringify(data));
        } else if (site === siteType._hb.slice(1)) {
          await redisClient.set(cacheKey + siteType._hb, JSON.stringify(data));
        }
      }

      // Cache all products
      if (req.query.hasOwnProperty("isAllProduct") && isAllProduct === "true") {
        const cacheKey = redisCacheVariable.allProducts;
        
        if (site === siteType._all.slice(1)) {
          await redisClient.set(cacheKey + siteType._all, JSON.stringify(data));
        } else if (site === siteType._auctropin.slice(1)) {
          await redisClient.set(cacheKey + siteType._auctropin, JSON.stringify(data));
        } else if (site === siteType._hb.slice(1)) {
          await redisClient.set(cacheKey + siteType._hb, JSON.stringify(data));
        }
      }
    }

    return res.status(200).json(
      responseSuccess(
        customerControllerMessages.product.getPublicProducts.successMsg,
        data
      )
    );
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const getNewProducts = async (req, res, next) => {
  try {
    const { site = "hb" } = req.query;
    let query = {
      showAsNewProduct: true,
      isActive: true,
      site: site,
    };

    const redisData = await redisClient.get(
      redisCacheVariable.allNewProducts + `_${site}`
    );
    if (redisData && site !== "all") {
      //res.set('Cache-Control', 'public, max-age=600'); // 10min.
      return res
        .status(200)
        .json(responseSuccess("fetch new products", JSON.parse(redisData)));
    }

    const customerId = req?.customer?._id || null;
    let restrictionQuery = {};
    // const productIds = await ProductModel.find({
    //   "restrictOptions.isRestricted": true,
    //   isActive: true,
    //   site: site,
    // }).lean().distinct('_id');

    // const baseRestrictedQueryByOrder = { customer: customerId, "products.product": { $in: productIds }, site: site, status: { $nin: ['CANCELLED', 'PENDING', 'FAILED'] }, "payment.isPaymentCompleted": true, isTestOrder: false }

    // const matchingOrders = await OrderModel.find(baseRestrictedQueryByOrder)
    //   .select('_id')
    //   .limit(2)
    //   .lean();

    // //minimum 2 order is required
    // if (matchingOrders?.length < 2) {
    //   restrictionQuery = {
    //     $or: [
    //       { "restrictOptions.isRestricted": false }, // Non-restricted products
    //     ]
    //   };
    // } else {
    // const customerHasOrderRestrictedProductIds = await OrderModel.find(baseRestrictedQueryByOrder).lean().distinct('products.product');

    // console.log("customerHasOrderRestrictedProductIds", customerHasOrderRestrictedProductIds)
    // Restriction query to filter products based on customer's order history
    // restrictionQuery = {
    //   $or: [
    //     { "restrictOptions.isRestricted": false }, // Non-restricted products
    //     {
    //       "restrictOptions.isRestricted": true,
    //       "_id": { $in: customerHasOrderRestrictedProductIds }
    //     }
    //   ]
    // };
    // }

    // Restriction query to filter products based on customer's
    restrictionQuery = {
      $or: [
        { "restrictOptions.isRestricted": false }, // Non-restricted products
        {
          "restrictOptions.isRestricted": true,
          "restrictOptions.customers": { $in: [customerId] },
        },
      ],
    };

    // Combine search and restriction queries
    if (Object.keys(query).length > 0) {
      // If there's an existing query (e.g., from buildSearchProductQuery), combine with $and
      query = {
        $and: [
          query, // Search query (may contain $or)
          restrictionQuery,
        ],
      };
    } else {
      // If no search query, use restriction query directly
      query = restrictionQuery;
    }

    const data = await ProductModel.find(query).sort("-createdAt").lean();

    const result = responseSuccess("fetch new products", data);

    if (site == siteType._all.slice(1)) {
      await redisClient.set(
        redisCacheVariable.allNewProducts + siteType._all,
        JSON.stringify(result)
      );
    }
    if (site == siteType._auctropin.slice(1)) {
      await redisClient.set(
        redisCacheVariable.allNewProducts + siteType._auctropin,
        JSON.stringify(result)
      );
    }

    if (site == siteType._hb.slice(1)) {
      await redisClient.set(
        redisCacheVariable.allNewProducts + siteType._hb,
        JSON.stringify(result)
      );
    }

    //res.set('Cache-Control', 'public, max-age=600'); // 10min.
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    next(error);
  }
};
