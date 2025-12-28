import { customerControllerMessages } from "../../common/index.js";
import { redisClient } from "../../config/db.js";
import { redisCacheVariable } from "../../config/redisCacheVariable.js";
import ContactCategoryModel from "../../models/ContactCategory.model.js";
import { findWithPagination, responseSuccess } from "../../utils/index.js";

export const contactCategorySingleDetails = async (req, res, next) => {
    try {

        const data = await ContactCategoryModel.findOne({ _id: req?.params?._id }).select({
            createdByAdmin:0,
            lastActionByAdmin:0,
        })
        return res.status(200).json(responseSuccess(data?._id ? customerControllerMessages.contactCategory.contactCategorySingleDetails.successMsg : customerControllerMessages.contactCategory.contactCategorySingleDetails.errorMsg, data))

    } catch (error) {
        console.error(error);
        next(error);
    }
}

export const getPublicContactCategories = async (req, res, next) => {
    try {
        const { q, page, limit } = req.query;
        const redisData = await redisClient.get(redisCacheVariable.contactCategories)
        if (redisData) {
          return res.status(200).json(responseSuccess(customerControllerMessages.contactCategory.getPublicContactCategories.successMsg, JSON.parse(redisData)))
        }



        const options = {
            model: ContactCategoryModel,
            query: {},
            sort: {
                createdAt: 1,
            },
            select:{
                createdByAdmin:0,
                lastActionByAdmin:0,
            },
            page: page || 1,
            limit: limit || 300,
            hint: null,
            populate: null,
        }

        if (q) {

            options.query = {
                siteName: { $regex: new RegExp(q, 'i') }
            }
        }

        const data = await findWithPagination(options)
        await redisClient.set(redisCacheVariable.contactCategories,JSON.stringify(data))
        return res.status(200).json(responseSuccess(customerControllerMessages.contactCategory.getPublicContactCategories.successMsg, data))
    } catch (error) {
        console.error(error)
        next(error)
    }
}