import mongoose from 'mongoose';
const { Schema } = mongoose;

const couponSchema = new Schema(
    {
        createdByAdmin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
        },
        lastActionByAdmin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
        },
        value: { type: Number, required: true },
        code: { type: String, required: true, index: true },
        totalUses: { type: Number, default: 0 },
        quantity: { type: Number, default: null },
        enableAllProducts: { type: Boolean, default: false },
        expiry: { type: Date, default: null },
        products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
        excludeProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],

        excludeAllCycleProducts: {
            type: Boolean,
            default: false
        },
        excludeAllBundleProducts: {
            type: Boolean,
            default: false
        },
        excludeAll3PackTriplePlayBundleProducts: {
            type: Boolean,
            default: false
        },
        excludeAll10PackMegaBundleProducts: {
            type: Boolean,
            default: false
        },
        isActive: {
            type: Boolean,
            default: true
        },
        site: {
            type: String, //ex: hb,auctropin
            default: 'hb'
        },

    },

    {
        timestamps: true,
        versionKey: false,
    }
);

const CouponModel = mongoose.model('Coupon', couponSchema);

export default CouponModel
