import mongoose from "mongoose";

const ProductViewSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
        },
        productOwner: {
            //product creator
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            default:null
        },
        customer: {
            //product customer
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            default: null,
        },
        site:{
            type:String,
            default:'hb'//auctropin
        },
        date:{
            type:String,
            default:null
        }
    },
    { timestamps: true }
);
const ProductViewModel = mongoose.model("ProductView", ProductViewSchema)

export default ProductViewModel