import { customerControllerMessages } from "../../common/index.js";
import { redisClient } from "../../config/db.js";
import { redisCacheVariable } from "../../config/redisCacheVariable.js";
import CategoryModel from "../../models/Category.model.js";
import { findWithPagination, responseSuccess } from "../../utils/index.js";

export const categorySingleDetails = async (req, res, next) => {
  try {

    const data = await CategoryModel.findOne({ slug: req?.params?.slug }).select({
      createdByAdmin: 0,
      lastActionByAdmin: 0,
    })
    return res.status(200).json(responseSuccess(data?._id ? customerControllerMessages.category.categorySingleDetails.successMsg : customerControllerMessages.category.categorySingleDetails.errorMsg, data))

  } catch (error) {
    console.error(error);
    next(error);
  }
}

export const getPublicCategories = async (req, res, next) => {
  try {
    const { q, page, sort, limit } = req.query;

    if (sort && sort.trim() === 'showInHome') {
      const redisData = await redisClient.get(redisCacheVariable.homeCategories)
      console.log(redisData,'redisData',limit)
      if (redisData) {
        res.set('Cache-Control', 'public, max-age=600'); // 10min.
        return res.status(200).json(responseSuccess(customerControllerMessages.category.getPublicCategories.successMsg, JSON.parse(redisData)))
      }
    } else {
      const redisData = await redisClient.get(redisCacheVariable.appCategories)
      if (redisData) {
        res.set('Cache-Control', 'public, max-age=600'); // 10min.
        return res.status(200).json(responseSuccess(customerControllerMessages.category.getPublicCategories.successMsg, JSON.parse(redisData)))
      }
    }


    const options = {
      model: CategoryModel,
      query: {},
      sort: {
        createdAt: -1,
      },
      select: {
        createdByAdmin: 0,
        lastActionByAdmin: 0,
      },
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 6,
      hint: null,
      populate: null,
    }

    if (q) {
      options.query = {
        name: { $regex: new RegExp(q, 'i') }
      }
    }
    // console.log(sort,'sort')
    if (sort) {
      switch (sort) {
        case 'latest':
          options.sort = { 'createdAt': -1 };
          break;
        case 'oldest':
          options.sort = { 'createdAt': 1 };
          break;
        case 'showInHome':
          options.query['homePage.display'] = true
          options.sort = { 'homePage.order': 1 };
          break;
        default:
          options.sort = { 'createdAt': -1 }; // Default to latest
      }
    }

    const data = await findWithPagination(options)
    if (sort && sort.trim() === 'showInHome') {
      await redisClient.set(redisCacheVariable.homeCategories,JSON.stringify(data))
    } else {
      await redisClient.set(redisCacheVariable.appCategories,JSON.stringify(data))
    }
    res.set('Cache-Control', 'public, max-age=600'); // 10min.
    return res.status(200).json(responseSuccess(customerControllerMessages.category.getPublicCategories.successMsg, data))
  } catch (error) {
    console.error(error)
    next(error)
  }
}
