import mongoose from "mongoose";
const LabTestedProductSchema = new mongoose.Schema({
    createdByAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
    },
    lastActionByAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
    },
    title: {
        type: String,
        required: [true, 'Title is required!']
    },
    advertisedAt: {
        type: String,
        required: [true, 'AdvertisedAt is required!']
    },
    testedAt: {
        type: String,
        required: [true, 'TestedAt is required!']
    },
    reportLink: {
        type: String,
        required: [true, 'ReportLink is required!']
    },
    bgImage: {
        type: String,
        required: [true, 'BgImage is required!']
    },
    //upload image file
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],

    isActive: {
        type: Boolean,
        default: true
    },
    site: {
        type: String, //ex: hb,auctropin
        default: 'hb'
    },


}, { timestamps: true })

const LabTestedProductModel = mongoose.model('LabTestedProduct', LabTestedProductSchema)
export default LabTestedProductModel