import { customerControllerMessages } from "../../common/index.js";
import FaqModel from "../../models/Faq.model.js";
import { findWithPagination, isValidObjectId, responseError, responseSuccess } from "../../utils/index.js";

export const faqSingleDetails = async (req, res, next) => {
    try {
        if(!isValidObjectId(req?.params?._id ))return res.status(400).json(responseError( customerControllerMessages.faq.faqSingleDetails.errorMsg ))
        const data = await FaqModel.findOne({ _id: req?.params?._id }).select({
            createdByAdmin:0,
            lastActionByAdmin:0,
        }).lean()
        return res.status(200).json(responseSuccess(data?._id ? customerControllerMessages.faq.faqSingleDetails.successMsg : customerControllerMessages.faq.faqSingleDetails.errorMsg, data))

    } catch (error) {
        console.error(error);
        next(error);
    }
}
export const getPublicFaqs = async (req, res, next) => {
    try {
        const { q, page, limit } = req.query;
        const options = {
            model: FaqModel,
            query: {},
            sort: {
                createdAt: 1,
            },
            select:{
              
                    createdByAdmin:0,
                    lastActionByAdmin:0,
          
            },
            page: page || 1,
            limit: limit || 10,
            hint: null,
            populate: null,
        }

        if (q) {
            options.query = {
                question: { $regex: new RegExp(q, 'i') }
            }
        }

        const data = await findWithPagination(options)
        return res.status(200).json(responseSuccess(customerControllerMessages.faq.getPublicFaqs.successMsg, data))
    } catch (error) {
        console.error(error)
        next(error)
    }
}