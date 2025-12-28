import mongoose from 'mongoose'
import { customerControllerMessages } from '../../common/index.js'
import { redisClient } from '../../config/db.js'
import { redisCacheVariable } from '../../config/redisCacheVariable.js'
import { AuctropinCustomerMailController } from '../../mail/auctropinIndex.js'
import { CustomerMailController } from '../../mail/index.js'
import ContactModel from '../../models/Contact.model.js'
import ContactCategoryModel from '../../models/ContactCategory.model.js'
import {
  findWithPagination,
  responseError,
  responseSuccess
} from '../../utils/index.js'

export const contactCreate = async (req, res, next) => {
  try {
    req.body['customer'] = req?.customer?._id || null
    req.body['site'] = req.body?.site || "hb"

    const contactCategory = await ContactCategoryModel.findOne({
      _id: req.body.contactCategory
    }).lean()
    // console.log(contactCategory, req.body.contactCategory,'contact')
    if (!contactCategory) {
      await redisClient.del(redisCacheVariable.contactCategories)
      return res.status(400).json(responseError(customerControllerMessages.contact.contactCreate.contactCategoryError))
    }

    let data = await ContactModel.create(req.body)
    if (data) {
      data = data.toObject()
      data['contactCategory'] = contactCategory;
    }
  
const subject =contactCategory.name=="wholesale"?"New Wholesale Contact Request":"New Contact Request"
    const send = req.body.site == 'auctropin' ? await AuctropinCustomerMailController.contact.SendContactUsMailAdmin(data,subject) : await CustomerMailController.contact.SendContactUsMailAdmin(data,subject)
    if (send) {
      return res
        .status(200)
        .json(
          responseSuccess(
            customerControllerMessages.contact.contactCreate.successMsg
          )
        )
    } else {
      return res
        .status(400)
        .json(
          responseError(
            customerControllerMessages.contact.contactCreate.errorMsg
          )
        )
    }
  } catch (error) {
    next(error)
  }
}

export const getCustomerContacts = async (req, res, next) => {
  try {
    const { page, site, contactCategoryId, limit } = req.query
    if (!req?.customer?._id)
      return res
        .status(200)
        .json(
          responseSuccess(
            customerControllerMessages.contact.getCustomerContacts.successMsg,
            []
          )
        )

    const options = {
      model: ContactModel,
      query: {},
      sort: {
        createdAt: -1
      },
      select: {
        createdByAdmin: 0,
        lastActionByAdmin: 0
      },
      page: page || 1,
      limit: limit || 10,
      hint: null,
      populate: null
    }

    if (req.query.hasOwnProperty('contactCategoryId') && contactCategoryId) {
      if (!isValidObjectId(contactCategoryId)) {
        return res
          .status(400)
          .json(
            responseError(
              adminControllerMessages.contact.getCustomerContacts
                .contactCategoryIdError
            )
          )
      }
      options.query['contactCategoryId'] =
        mongoose.Types.ObjectId(contactCategoryId)
    }
    if (site !== "all" && site !== "" && site) {
      options.query['site'] = site.trim()
    }
    options.query['customer'] = req?.customer?._id


    const data = await findWithPagination(options)
    return res
      .status(200)
      .json(
        responseSuccess(
          customerControllerMessages.contact.getCustomerContacts.successMsg,
          data
        )
      )
  } catch (error) {
    next(error)
  }
}
