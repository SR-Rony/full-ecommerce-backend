import mongoose from "mongoose";
import { siteDomains } from "../config/constant.js";

const CustomerSchema = new mongoose.Schema({

    email: {
        type: String,
        lowercase: true,
        required: [true, 'email is required!']
    },
    pass: {
        type: String,
        required: [true, 'pass is required!']
    },
    availableCreditBalance:{
        type:Number,
        default:0
    },
    lastTransactionDate:{
        type:Date,
        default:null
    },
    avatar: {
        type: String,
        default: 'https://cdn.peptide.shop/public/8b3afddf-d76c-4498-a2b7-3a2b26bede06.jpg'
    },
    firstName: {
        type: String,
        default: null
    },
    lastName: {
        type: String,
        default: null
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    isEmailInvalid: {
        type: Boolean,
        default: false
    },
    emailInvalidReason: {
        type: String,
        default: ""
    },
    phone: {
        country: { type: String },
        dialingCode: { type: String },
        nationalNumber: { type: String },
        number: { type: String },
    },
    activity: {
        lastLoginAt: {
            type: Date,
            default: new Date(),
        },
        lastActivityAt: {
            type: Date,
            default: new Date()
        },
        lastAccountUpdatedBy: {
            type: String,
            enum: ['admin', 'self'],
            default: "self"
        },
        lastAccountUpdatedByAdmin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
            default: null
        }
    },
    bulkContact: {
        lastSent: Date,
        bulkContactId: {

        }
    },
    lastOrderPaidAt: {
        type: Date,
        default: null
    },
    site: {
        type: String, //ex: hb,auctropin
        default: 'hb'
    },
    origin: {
        type: String,
        default: siteDomains.default,
    },
    isTestCustomer:{
        type:Boolean,
        default:false
    },
    forum: {
        username: { type: String, default: null }, // Forum username
        userSince: { type: String, default: null }, // How long they are forum user
        link: { type: String, default: null } // Forum link
    },
    hasPrimoIssue: {
        type: Boolean,
        default: false,
    },
    allow_refund_request:{
        type:Boolean,
        default:false
    },
    haveSeenPrimoPage: {
        type: Boolean,
        default: false,
    },
    howHeardAbout: {
        type: String,
        default: null // How heard about
    },
    industryExperienceYears: {
        type: String,
        default: null // How long they been industries (years)
    },
    isApprovalPendingEmailAlreadySent: {
        type: Boolean,
        default: false
    },
    approved_by_admin_at: {
        type: Date,
        default: null
    },
    creditBalanceRefund: {
        refundRequestedAt:{
            type: Date,
            default: null
        },
        refundAmount:{
            type:Number,
            default:0
        },
        refundCompletedAt:{
            type:Date,
            default:null
        },
        refundInformation: {
            email: {
                type: String,
                default: null
            },
            btcAddress: {
                type: String,
                default: null
            },  
        },
        transactionId: {
            type: String,
            default: null,
        },
        note: {
            type: String,
            default: null,
        },
        refund_request_url_token:{
            type: String,
            default: null
        },
        token_gen_at:{
            type: Date,
            default: null
        },
        token_invalid_at:{
            type: Date,
            default: null
        }
    },
}, { timestamps: true })

const CustomerModel = mongoose.model("Customer", CustomerSchema)
export default CustomerModel