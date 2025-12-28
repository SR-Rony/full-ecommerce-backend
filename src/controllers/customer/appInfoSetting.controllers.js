import { customerControllerMessages } from "../../common/index.js";
import { redisClient } from "../../config/db.js";
import { redisCacheVariable } from "../../config/redisCacheVariable.js";
import ModalPopupModel from "../../models/ModalPopup.model.js";
import AppInfoSettingModel from "../../models/Setting/AppInfoSetting.model.js";
import LiveChatOptionSettingModel from "../../models/Setting/LiveChatOption.model.js";
import ShippingSettingModel from "../../models/Setting/ShippingOptionSetting.model.js";
import { responseError, responseSuccess } from "../../utils/index.js";

export const appInfoSettingSingleLatestDetails = async (req, res, next) => {
  try {
    const { site = "hb" } = req.query

    const query = {

    }
    if (site && site !== 'all') {
      query['site'] = site
    }
    const redisData = await redisClient.get(`${redisCacheVariable.appInfo}_${site}`)
    if (redisData) {
      res.set('Cache-Control', 'public, max-age=600'); // 10min.
      return res.status(200).json(responseSuccess(customerControllerMessages.appInfoSetting.appInfoSettingSingleLatestDetails.successMsg, JSON.parse(redisData)))
    }

    const data = {}
    data['appInfo'] = await AppInfoSettingModel.findOne({}).select({
      createdByAdmin: 0,
      lastActionByAdmin: 0,
    }).sort("-updatedAt")

    const shippingOptionsAggregatePipeline = [
      {
        $match: {
          isActive: true
        }
      },
      {
        $addFields: {
          label: '$name',
          value: '$country.value',
          country: '$country.label',
          countryShortCode: '$country.value',
        }
      }
    ];
    data['shippingOptions'] = await ShippingSettingModel.find({...query, isActive: true }).populate("shippingCountry").lean()//.aggregate(shippingOptionsAggregatePipeline)
    data['shippingOptions'].forEach((e) => {
      e.label = e.name;
      e.value = e.shippingCountry.country.value;
      e.country = e.shippingCountry.country.label;
      e.countryShortCode = e.shippingCountry.country.value;
      e.shippingCountry = e.shippingCountry._id;
      // console.log(e)
    })
    data['liveChatOptions'] = await LiveChatOptionSettingModel.find({}).sort("-orderNum").lean()
    data['modalPopup'] = await ModalPopupModel.findOne({}).sort("-updatedAt").lean()
    await redisClient.set(`${redisCacheVariable.appInfo}_${site}`, JSON.stringify(data))
    res.set('Cache-Control', 'public, max-age=600'); // 10min.
    return res.status(200).json(responseSuccess(customerControllerMessages.appInfoSetting.appInfoSettingSingleLatestDetails.successMsg, data))

  } catch (error) {
    console.error(error);
    next(error);
  }
}
export const getRegistrationFieldCheck = async (req, res, next) => {
  try {


    const appInfoSetting = await AppInfoSettingModel.findOne({}).select("registration").sort("-updatedAt");
    

    const registrationFields = appInfoSetting?.registration;

    if (!registrationFields) {
      return res.status(404).json(responseError('Registration settings not found'));
    }


    const response = {
      isRegistrationAllowed:registrationFields?.isRegistrationAllowed||false,
      username: registrationFields?.username||{},
      userSince: registrationFields?.userSince||{},
      link: registrationFields?.link||{},
      howHeardAbout: registrationFields?.howHeardAbout||{},
      industryExperienceYears: registrationFields?.industryExperienceYears||{}
    };

    return res.status(200).json(responseSuccess('Registration field configuration retrieved successfully', response));

  } catch (error) {
    console.error(error);
    next(error);
  }
}

