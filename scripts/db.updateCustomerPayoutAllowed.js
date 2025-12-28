import CustomerModel from "../src/models/Customer.model.js";

const customersAllowed = [
   
        ]
export const updateCustomerPayoutAllowed = async () => {
    console.log("updateCustomerPayoutAllowed=> old order update allow_refund_request 'allow_refund_request' initiated")
   const res = await CustomerModel.updateMany(
        { "allow_refund_request": { $exists: false } },
        { $set: { "allow_refund_request": false } },
        { new: true }
    );
console.log("updateCustomerPayoutAllowed=> old order update allow_refund_request 'allow_refund_request' initiated",res)
if(customersAllowed.length > 0){
   const processsEnabled= await CustomerModel.updateMany(
        { "email": { $in: customersAllowed } },
        { $set: { "allow_refund_request": true } },
        { new: true }
    );
        console.log("updateCustomerPayoutAllowed=> old order update allow_refund_request 'allow_refund_request' completed true results",processsEnabled)
}

}
