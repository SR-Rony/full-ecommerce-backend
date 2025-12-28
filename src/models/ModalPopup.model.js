import mongoose from 'mongoose';

const ModalPopupSchema = new mongoose.Schema({
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
        validate: {
            validator: function (value) {
                return value.length <= 70;
            },
            message: "Title is required! Maximum length is 70 characters."
        },
        required: false
    },

    titleTextColor: {
        type: String,
        default: null

    },
    description: {
        type: String,
        validate: {
            validator: function (value) {
                return value.length <= 150;
            },
            message: "Description is required! Maximum length is 150 characters."
        }
        ,
        required: false
    },
    descriptionTextColor: {
        type: String,
        default: null
    },
    backgroundColorOfTitleDescriptionButton: {
        type: String,
        default: null
    },
    button: {
        checked: {
            type: Boolean,
            default: false
        },
        text: {
            type: String,
            default: null
        },
        backgroundColor: {
            type: String,
            default: null
        },
        textColor: {
            type: String,
            default: null
        },
        redirectUrl: {
            type: String,
            default: null
        }

    },
    isHideTitleDescription: {
        type: Boolean,
        default:false
    },
    image: {
        imgUrl: { type: String },
        redirectUrl: { type: String, default: null },
    },
    isActive: { type: Boolean, default: true },

}, { timestamps: true });

// Corrected line: Use mongoose.model to create the model
const ModalPopupModel = mongoose.model("ModalPopup", ModalPopupSchema);

export default ModalPopupModel;
