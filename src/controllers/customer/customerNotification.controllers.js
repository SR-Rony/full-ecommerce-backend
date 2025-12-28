import moment from "moment"
import CustomerModel from "../../models/Customer.model.js"
import CustomerNotificationModel from "../../models/CustomerNotification.model.js"
import UnsubscriberModel from "../../models/Unsubscriber.model.js"
import { Decrypted, findWithPagination, isValidDate, isValidObjectId } from "../../utils/func.js"
import { responseError, responseSuccess } from "../../utils/index.js"

export const customerNotificationHide = async (req, res, next) => {
    try {
        if (!req?.customer?._id) {
            return res.status(400).json(responseError('Authentication failed!', 400))
        }
        const data = await CustomerNotificationModel.findOneAndUpdate({ _id: req?.params?._id, customerId: req.customer?._id }, { isDisplay: false }, { new: true })

        if (!data?._id) return res.status(400).json(responseError('Failed to hide notification', 400))
        return res.status(200).json(responseSuccess('Notification hide successfully!', data))
    } catch (error) {
        next(error)
    }
}

export const getCustomerNotifications = async (req, res, next) => {
    try {
        const { page, limit, q, startDate, endDate, orderId, isDisplayHome } = req.query

        if (!req?.customer?._id) {
            return res.status(400).json(responseError('Authentication failed!', 400))
        }
        // Get the order list
        const options = {
            model: CustomerNotificationModel,
            query: {
                customerId: req?.customer?._id,
            },
            sort: {
                createdAt: -1,
            },
            select: null,
            page: parseInt(page) || 1,
            limit: isDisplayHome ? (parseInt(limit) || 10) : undefined,
            hint: null,
            populate: null
        };

        if (q) {
            options.query = {
                "msgTemplate": { $regex: new RegExp(q, "i") },
            };
        }
        if (orderId) {
            options.query['meta.orderId'] = orderId.trim()
        }

        if (startDate && endDate) {
            if (!isValidDate(startDate)) {
                return res
                    .status(400)
                    .json(
                        responseError(
                            "Query startDate invalid!"
                        )
                    );
            }
            if (!isValidDate(endDate)) {
                return res
                    .status(400)
                    .json(
                        responseError(
                            "Query endDate invalid!"
                        )
                    );
            }

            options.query["createdAt"] = {
                $gte: moment(startDate)
                    .startOf("day")
                    .toDate(),
                $lte: moment(endDate)
                    .endOf("day")
                    .toDate(),
            };
        }

        if (req.query.hasOwnProperty('isDisplayHome') && isDisplayHome === 'true') {
            options.query['isDisplay'] = true
        }
        const data = await findWithPagination(options);
        //res.set('Cache-Control', 'public, max-age=30'); // 30 seconds
        return res.status(200).json(responseSuccess('fetch notification', data))
    } catch (error) {
        next(error)
    }
}
export const unsubscribeNotification = async (req, res, next) => {
    try {
        const { _id } = req.params;
        const decode = Decrypted(_id)
        const { site = "hb" } = req.body;
        const queryCustomer = {
            site
        }
        const saveData = {
            isBulkMailSubscribe: false,
            site
        }
        if (isValidObjectId(decode)) {
            queryCustomer['_id'] = decode

        } else {
            queryCustomer['email'] = decode

        }
        const existCustomer = await CustomerModel.findOne(queryCustomer).lean()

        const query = {

        }
        if (existCustomer?._id) {
            query['customer'] = existCustomer?._id
            query['site'] = existCustomer?.site
            saveData['customer'] = existCustomer?._id
            saveData['site'] = existCustomer?.site
            saveData['email'] = null
        } else {
            if (isValidObjectId(decode)) {
                query['customer'] = decode
                saveData['site'] = site
            }else{
                query['email'] = decode
                saveData['email'] = decode
                saveData['site'] = site
            }
        }

        // console.log(query)
        const exist = await UnsubscriberModel.findOneAndUpdate(query, saveData, { new: true, upsert: true })
        return res.status(200).json(responseSuccess('Unsubscribe successfully!', null))
    } catch (error) {
        console.log(error)
        next(error)
    }
}
export const subscribeNotification = async (req, res, next) => {
    try {
        const { _id } = req.params;
        const { site } = req.body;
        if (!site) return res.status(200).json(responseError('Site is required!', 400))
        let queryCustomer = {

        }
        let saveData = {
            isBulkMailSubscribe: true,
            site
        }
        if (isValidObjectId(_id)) {
            queryCustomer['customer'] = _id
           
        } else {
            queryCustomer['email'] = _id
        }

        const exist = await UnsubscriberModel.findOneAndUpdate(queryCustomer, saveData, { new: true, upsert: true })
        return res.status(200).json(responseSuccess('Subscribe successfully!', null))
    } catch (error) {
        console.log(error)
        next(error)
    }
}

export const unsubscribeNotificationByEmail = async (req, res, next) => {
    try {
        const { email } = req.body;
        const site = req.query.site || "hb";

        if(!email) {
            return res.status(400).json(responseError('Email is required!', 400))
        }

        const queryCustomer = {
            site,
            email,
        }

        const saveData = {
            isBulkMailSubscribe: false,
            site
        }

        const existCustomer = await CustomerModel.findOne(queryCustomer).lean()
        const query = {}

        if (existCustomer?._id) {
            query['customer'] = existCustomer?._id
            query['site'] = existCustomer?.site
            saveData['customer'] = existCustomer?._id
            saveData['site'] = existCustomer?.site
            saveData['email'] = null
        } else {
            query['email'] = email
            saveData['email'] = email
            saveData['site'] = site
        }
        await UnsubscriberModel.findOneAndUpdate(query, saveData, { new: true, upsert: true })
        return res.status(200).json(responseSuccess('Unsubscribe successfully!', null))
    } catch (error) {
        console.log(error)
        next(error)
    }
}