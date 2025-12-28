import mongoose from "mongoose";

const ShippingCountrySchema = new mongoose.Schema(
    {
        country: {
            label: {
                type: String,
                default: "United States",
                required: [true, "Please select a country!"],
                unique: true
            },
            value: {
                type: String,
                default: "US",
                required: [true, "Please select a country!"],
                unique: true
            }
        },
        isActive:{
            type:Boolean,
            default:true
        }
    },
    { timestamps: true }
);

const ShippingCountryModel = mongoose.model("ShippingCountry", ShippingCountrySchema)
export default ShippingCountryModel