import mongoose from "mongoose";
const ContactCategorySchema = new mongoose.Schema({
    createdByAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
    },
    lastActionByAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
    },
    name: {
        type: String,
        required: [true, "name is required!"],
    }
}, { timestamps: true })

const ContactCategoryModel = mongoose.model('ContactCategory', ContactCategorySchema)
export default ContactCategoryModel