import mongoose from 'mongoose';
const registrationFieldSchema = new mongoose.Schema({
  isActive: {
    type: Boolean,
    required: true,
    default: true
  },
  isRequired: {
    type: Boolean,
    required: true,
    default: false
  }
}, { _id: false });

const AppInfoSettingSchema = new mongoose.Schema({
    createdByAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
    },
    lastActionByAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
    },
    siteLogo:{
        type:String,
        required:[true,'siteLogo is required!'],
        default:"https://i.ibb.co/wLm1D8Q/logo.webp"
    },
    siteName: { type: String, default:null },
    siteTagline: { type: String,  default:null },
    footerTagLine: { type: String, default:null },
    contactToAdmin: {
        email: { type: String, default:null },
        description:{ type: String,  default:null },
    },
    topBanner:{
    headingText:{type:String,default:null},
    headingText2:{type:String,default:null},
    bannerTopImageMobile:{type:String,default:null},
    bannerTopImageDesktop:{type:String,default:null}
    },
    headerBanner:{
        title:{type:String,default:null}, //ALL TRANSACTIONS ARE PAID VIA BITCOIN
        iconImage:{type:String,default:null},
        app1:{
            text:{type:String,default:null},
            image:{type:String,default:null},
            ctaImage:{type:String,default:null},
            redirectUrl:{type:String,default:null}
        },
        app2:{
            text:{type:String,default:null},
            image:{type:String,default:null},
            ctaImage:{type:String,default:null},
            redirectUrl:{type:String,default:null}
        },
        app3:{
            text:{type:String,default:null},
            image:{type:String,default:null},
            ctaImage:{type:String,default:null},
            redirectUrl:{type:String,default:null}
        }
    },
    warningTexts:{
        checkoutPage:{type:String,default:null},
        finalCheckout:{type:String,default:null},
        checkoutPaymentDetailsPopup:{type:String,default:null},
        customerPanel:{type:String,default:null},
        cartPageWarningText:{type:String,default:null},
        cartPageWarningColor:{type:String,default:null}
    },
    liveChatInfo:{
        title:{type:String,default:""},
        subTitle:{type:String,default:""},
        p1:{type:String,default:""},
        p2:{type:String,default:""},
    },
    registration: {
        isRegistrationAllowed: { type: Boolean, default: false },
        isRegistrationAdminApprovalRequired: { type: Boolean, default: false },
        username: registrationFieldSchema,
        userSince: registrationFieldSchema,
        link: registrationFieldSchema,
        howHeardAbout: registrationFieldSchema,
        industryExperienceYears: registrationFieldSchema
    },
    freebieInfo:{
        title:{type:String,default:null},
        description:{type:String,default:null}
    }
}, { timestamps: true })
const AppInfoSettingModel = mongoose.model("AppInfoSetting", AppInfoSettingSchema)
export default AppInfoSettingModel;




