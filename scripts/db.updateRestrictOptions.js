import ProductModel from "../src/models/Product.model.js";

export const updateOrderRestrictOptions = async () => {
    console.log("updateOrderRestrictOptions=> old order update isRestricted 'restrictOptions' initiated")
   const res = await ProductModel.updateMany(
        { "restrictOptions.isRestricted": { $exists: false } },
        { $set: { "restrictOptions.isRestricted": false } },
        { new: true }
    );
    console.log("updateOrderRestrictOptions=> old order update isRestricted 'restrictOptions' completed",res)
}
