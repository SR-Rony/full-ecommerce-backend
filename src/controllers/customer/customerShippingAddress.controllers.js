import jwt from 'jsonwebtoken'
import _ from 'lodash'
import { customerControllerMessages } from '../../common/index.js'
import { redisClient } from '../../config/db.js'
import CONFIG from '../../config/index.js'
import CustomerModel from '../../models/Customer.model.js'
import CustomerShippingAddressModel from '../../models/CustomerShippingAddress.model.js'
import {
  responseError,
  responseSuccess
} from '../../utils/index.js'

export const customerShippingAddressCreateAndUpdate = async (
  req,
  res,
  next
) => {
  try {
    // console.log("Req:: ",req.body)
    req.body['customer'] = req?.customer?._id
    req.body['email'] = req.customer?.email
    // console.log(req.body,'req.body')
    const bodyData = _.omit(req.body, ['_id'])
const customer = await CustomerModel.findOne({_id: req?.customer?._id}).lean()
    const data = await CustomerShippingAddressModel.findOneAndUpdate(
      { _id: req.customer?._id },
      { site:customer?.site||"hb","receiverName.firstName": req.body.firstName || req.body.receiverName?.firstName || undefined ,"receiverName.lastName":  (req.body.firstName || req.body.receiverName?.firstName)===undefined ? undefined : (req.body.lastName || req.body.receiverName?.lastName||""),...bodyData },
      { new: true, upsert: true }
    ).lean()

    const updatedData = {
      lastActivityAt:new Date(),
      lastAccountUpdatedBy:'self',
      lastAccountUpdatedByAdmin:null,
      firstName: req?.body?.firstName||req?.body?.receiverName?.firstName||req.body["receiverName.firstName"]||req?.customer?.firstName,
      lastName:req?.body?.lastName ||req?.body?.receiverName?.lastName||req.body["receiverName.lastName"]|| req?.customer?.lastName,
    }

  const shippingUpdated =  await CustomerModel.findOneAndUpdate(  { _id: req.customer?._id },updatedData,{new:true})
    const token = jwt.sign(
      {
        _id: shippingUpdated?._id,
        email: shippingUpdated?.email,
        phone: shippingUpdated?.phone || "",
        firstName: shippingUpdated?.firstName,
        lastName: shippingUpdated?.lastName,
        isEmailVerified: shippingUpdated?.isEmailVerified,
        isBlocked: shippingUpdated?.isBlocked || false,
        site: shippingUpdated?.site,
        activity: shippingUpdated?.activity,
        avatar: shippingUpdated?.avatar,
        isEmailInvalid: shippingUpdated?.isEmailInvalid,
        emailInvalidReason: shippingUpdated?.emailInvalidReason,
      },
      CONFIG.JWT.JWT_SECRET
    )

    data.token = token

    await redisClient.set(
      `customer_auth_token_${shippingUpdated?._id?.toString()}`,
      token
    )
    return res
      .status(200)
      .json(
        responseSuccess(
          customerControllerMessages.customerShippingAddress
            .customerShippingAddressCreateAndUpdate.successMsg,
          data
        )
      )
  } catch (error) {
    return next(error)
  }
}

export const customerShippingAddressGetDetails = async (req, res, next) => {
  try {
    const data = await CustomerShippingAddressModel.findOne({
      _id: req.customer?._id
    }).lean()
    if (!data?._id)
      return res
        .status(400)
        .json(
          responseError(
            customerControllerMessages.customerShippingAddress
              .customerShippingAddressGetDetails.errorMsg,
            [],
            400
          )
        )

    return res
      .status(200)
      .json(
        responseSuccess(
          customerControllerMessages.customerShippingAddress
            .customerShippingAddressGetDetails.successMsg,
          data
        )
      )
  } catch (error) {
    return next(error)
  }
}

export const customerShippingAddressSearch = async (req, res, next) => {
  try {

    const data = await CustomerShippingAddressModel.findOne({
      email: req?.query?.email
    }).lean()
    if (!data?._id)
      return res
        .status(400)
        .json(
          responseError(
            customerControllerMessages.customerShippingAddress
              .customerShippingAddressSearch.errorMsg,
            [],
            400
          )
        )

    return res
      .status(200)
      .json(
        responseSuccess(
          customerControllerMessages.customerShippingAddress
            .customerShippingAddressSearch.successMsg,
          data
        )
      )
  } catch (error) {
    return next(error)
  }
}
