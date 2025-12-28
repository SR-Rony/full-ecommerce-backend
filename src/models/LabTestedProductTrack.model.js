import mongoose from "mongoose";
const LabTestedProductTrackSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        default: null
    },

    labTestedProduct: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LabTestedProduct",
    },
    totalClicked: {
        type: Number,
        default: 0,
    },
    site: {
        type: String, //ex: hb,auctropin
        default: 'hb'
    },
    date: {
        type: String,
        default: null,
        required: true,
    }

}, { timestamps: true })

const LabTestedProductTrackModel = mongoose.model('LabTestedProductTrack', LabTestedProductTrackSchema)
export default LabTestedProductTrackModel