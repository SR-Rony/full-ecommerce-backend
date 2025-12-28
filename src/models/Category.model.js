import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
    createdByAdmin:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Admin",
    },
    name: {
        type: String,
        required: [true, 'name is required!'],

    },
    imageUrl: {
        type: String,
        required: false,
        default: null,
    },
    slug: {
        type: String,
        required: [true, 'slug is required!'],
        lowercase: true,
        trim:true,
        unique: true,
    },
    description: {
        type: String,
        default: null,
        trim: true,
    },
    icon: {
        size: {
            type: String,
            default: '32px'
        },
        url: { type: String, default: null }
    },
    mobileImage:{
        type:String,
        default:null
    },
    homePage:{
        display:{
            type:Boolean,
            default:false
        },
        order:{
            type:Number,
            default:0
        }
    }
}, { timestamps: true })

const CategoryModel = mongoose.model("Category", CategorySchema)

export default CategoryModel