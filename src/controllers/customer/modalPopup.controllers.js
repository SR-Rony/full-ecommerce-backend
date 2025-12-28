import { customerControllerMessages } from "../../common/index.js";
import ModalPopupModel from "../../models/ModalPopup.model.js";
import { responseSuccess } from "../../utils/index.js";


export const modalPopupSingleDetails = async (req, res, next) => {
    try {
        const data = await ModalPopupModel.findOne({ }).lean()
    
        return res.status(200).json(responseSuccess(data?._id ? customerControllerMessages.modalPopup.modalPopupSingleDetails.successMsg : customerControllerMessages.modalPopup.modalPopupSingleDetails.errorMsg, data))
  
    } catch (error) {
        console.error(error);
        next(error);
    }
  }
  
