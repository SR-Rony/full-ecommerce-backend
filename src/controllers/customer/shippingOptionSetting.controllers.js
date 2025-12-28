import { customerControllerMessages } from "../../common/index.js";
import ShippingSettingModel from "../../models/Setting/ShippingOptionSetting.model.js";
import { responseSuccess } from "../../utils/index.js";


export const shippingSettingSingleLatestOneDetails = async (req, res, next) => {
    try {
        const { site = 'hb' } = req.query
        const query = {

        }
        if (site !== "all" && site !== "" && site) {
            query['site'] = site.trim()
        }
        const data = await ShippingSettingModel.findOne(query).select({
            createdByAdmin: 0,
            lastActionByAdmin: 0
        }).sort("-createdAt")
        return res.status(200).json(responseSuccess(data?._id ? customerControllerMessages.shippingOptionSetting.shippingSettingSingleLatestOneDetails.successMsg : customerControllerMessages.shippingOptionSetting.shippingSettingSingleLatestOneDetails.errorMsg, data))

    } catch (error) {
        console.error(error);
        next(error);
    }
}