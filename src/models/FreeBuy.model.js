import mongoose from 'mongoose';

const FreeBuyModelSchema = new mongoose.Schema({
    createdByAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
    },
    lastActionByAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
    },
    minimumThreshold: { type: String, unique: true, required: [true, 'Minimum threshold amount is required!'] },
    freeProducts: [{
        type: mongoose.Types.ObjectId,
        ref: "Product"
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    site: {
        type: String, //ex: hb,auctropin
        default: 'hb'
    },


}, { timestamps: true });


const FreeBuyModel = mongoose.model("FreeBuy", FreeBuyModelSchema);

export default FreeBuyModel;
