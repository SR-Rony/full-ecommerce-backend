import mongoose from "mongoose";
const ContactSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        default:null
    },
    name:{
        type: String,
        default:null
    },
    email: { type: String, required: [true, "email is required!"] },
    contactCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ContactCategory"
    },
    message: { type: String, required: [true, "message is required!"] },
    site:{
        type:String, //ex: hb,auctropin
        default:'hb'
      }
}, { timestamps: true })

const ContactModel = mongoose.model('Contact', ContactSchema)
export default ContactModel